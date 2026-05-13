"""
DevDocs-AI RAG Pipeline Evaluation Suite (Fully Local)

Evaluates the RAG pipeline using only local Ollama models:
  - nomic-embed-text for embeddings
  - llama3.2:3b for response generation
  - qwen2.5:3b for LLM-as-a-Judge

No API keys needed. Run with:
    deepeval test run tests/evals/test_rag_pipeline.py --verbose
"""

import json
import os
import sys
import logging

import pytest

from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import (
    AnswerRelevancyMetric,
    ContextualRecallMetric,
    ContextualRelevancyMetric,
)

# Local imports (path set by conftest.py)
from ollama_judge import OllamaJudgeModel
from ollama_generator import generate_response, check_ollama_health
from eval_rag import EvalRetriever, get_collection_name

logger = logging.getLogger(__name__)

DATASET_PATH = os.path.join(os.path.dirname(__file__), "golden_dataset.json")
RESULTS_PATH = os.path.join(os.path.dirname(__file__), "eval_results.json")


def load_golden_dataset():
    with open(DATASET_PATH, "r") as f:
        return json.load(f)

DATASET = load_golden_dataset()
TEST_IDS = [item["id"] for item in DATASET]

# ── Initialize judge and metrics ──
judge = OllamaJudgeModel(model_name="qwen2.5:3b")

@pytest.mark.parametrize("item", DATASET, ids=TEST_IDS)
def test_rag_quality(item):
    """Evaluate a single RAG test case against all 3 metrics."""
    if not check_ollama_health():
        raise RuntimeError("Ollama is not running on localhost:11434")

    retriever = EvalRetriever()
    collection_name = get_collection_name(item["repo_url"])

    # 1. Retrieve context chunks
    docs = retriever.get_relevant_documents(collection_name, item["question"], k=5)
    retrieval_context = [doc.page_content for doc in docs]
    context_text = "\n\n".join(
        [f"--- SOURCE: {doc.metadata.get('source', 'unknown')} ---\n{doc.page_content}" for doc in docs]
    )

    # 2. Generate response
    actual_output = generate_response(item["question"], context_text)

    # 3. Build test case
    test_case = LLMTestCase(
        input=item["question"],
        actual_output=actual_output,
        expected_output=item["expected_answer"],
        retrieval_context=retrieval_context,
    )

    # Re-instantiate metrics per test to avoid state sharing issues across workers
    answer_relevancy = AnswerRelevancyMetric(threshold=0.5, model=judge, include_reason=False, async_mode=False)
    contextual_recall = ContextualRecallMetric(threshold=0.4, model=judge, include_reason=False, async_mode=False)
    contextual_relevancy = ContextualRelevancyMetric(threshold=0.4, model=judge, include_reason=False, async_mode=False)
    metrics = [answer_relevancy, contextual_recall, contextual_relevancy]

    # Run evaluation
    try:
        assert_test(test_case, metrics)
        passed = True
    except AssertionError:
        passed = False

    # Save individual result for the GitHub Action to aggregate
    result = {
        "id": item["id"],
        "input": item["question"],
        "actual_output": actual_output,
        "passed": passed,
        "scores": {}
    }
    for m in metrics:
        result["scores"][m.__class__.__name__] = {
            "score": getattr(m, "score", None),
            "threshold": m.threshold,
            "reason": getattr(m, "reason", None),
        }

    res_path = os.path.join(os.path.dirname(__file__), f"result_{item['id']}.json")
    with open(res_path, "w") as f:
        json.dump(result, f, indent=2)

    # Re-raise assertion if failed so pytest registers it
    if not passed:
        pytest.fail("One or more metrics failed")
