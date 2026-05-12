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


def build_test_cases():
    """
    For each golden question:
      1. Retrieve context from eval ChromaDB (Ollama embeddings)
      2. Generate response with Ollama llama3.2:3b
      3. Build an LLMTestCase
    """
    if not check_ollama_health():
        raise RuntimeError("Ollama is not running on localhost:11434")

    dataset = load_golden_dataset()
    retriever = EvalRetriever()
    test_cases = []
    test_ids = []

    logger.info(f"Building {len(dataset)} test cases (fully local)...")

    for item in dataset:
        collection_name = get_collection_name(item["repo_url"])

        # 1. Retrieve context chunks
        try:
            docs = retriever.get_relevant_documents(collection_name, item["question"], k=5)
        except Exception as e:
            logger.warning(f"  ⚠️  Retrieval failed for {item['id']}: {e}. Skipping.")
            continue

        retrieval_context = [doc.page_content for doc in docs]
        context_text = "\n\n".join(
            [f"--- SOURCE: {doc.metadata.get('source', 'unknown')} ---\n{doc.page_content}" for doc in docs]
        )

        # 2. Generate response with Ollama
        try:
            actual_output = generate_response(item["question"], context_text)
        except Exception as e:
            logger.warning(f"  ⚠️  Generation failed for {item['id']}: {e}. Skipping.")
            continue

        # 3. Build test case
        test_case = LLMTestCase(
            input=item["question"],
            actual_output=actual_output,
            expected_output=item["expected_answer"],
            retrieval_context=retrieval_context,
        )
        test_cases.append(test_case)
        test_ids.append(item["id"])
        logger.info(f"  ✅ {item['id']}")

    logger.info(f"Built {len(test_cases)}/{len(dataset)} test cases.")
    return test_cases, test_ids


# ── Initialize judge and metrics ──
judge = OllamaJudgeModel(model_name="qwen2.5:3b")

answer_relevancy = AnswerRelevancyMetric(
    threshold=0.5, model=judge, include_reason=True, async_mode=False,
)
contextual_recall = ContextualRecallMetric(
    threshold=0.4, model=judge, include_reason=True, async_mode=False,
)
contextual_relevancy = ContextualRelevancyMetric(
    threshold=0.4, model=judge, include_reason=True, async_mode=False,
)

ALL_METRICS = [answer_relevancy, contextual_recall, contextual_relevancy]

# ── Build test cases at module load ──
TEST_CASES, TEST_IDS = build_test_cases()


@pytest.mark.parametrize("test_case", TEST_CASES, ids=TEST_IDS)
def test_rag_quality(test_case: LLMTestCase):
    """Evaluate a single RAG test case against all 3 metrics."""
    assert_test(test_case, ALL_METRICS)


def pytest_sessionfinish(session, exitstatus):
    """Write evaluation results to JSON for CI artifact upload."""
    results = []
    dataset = load_golden_dataset()

    for i, tc in enumerate(TEST_CASES):
        entry = {
            "id": TEST_IDS[i] if i < len(TEST_IDS) else f"test_{i}",
            "input": tc.input,
            "actual_output": tc.actual_output,
            "scores": {},
        }
        for metric in ALL_METRICS:
            entry["scores"][metric.__class__.__name__] = {
                "score": getattr(metric, "score", None),
                "threshold": metric.threshold,
                "reason": getattr(metric, "reason", None),
            }
        results.append(entry)

    summary = {
        "total_tests": len(TEST_CASES),
        "exit_status": exitstatus,
        "results": results,
    }

    with open(RESULTS_PATH, "w") as f:
        json.dump(summary, f, indent=2, default=str)

    logger.info(f"📊 Results saved to {RESULTS_PATH}")
