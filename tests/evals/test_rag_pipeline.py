"""
DevDocs-AI RAG Pipeline Evaluation Suite

Evaluates the RAG pipeline across 6 public GitHub repos using:
  - Ollama (llama3.2:3b) for response generation
  - Groq (llama-3.3-70b-versatile) as the LLM judge
  - DeepEval metrics: Answer Relevancy, Contextual Recall, Contextual Relevancy

Run with:
    deepeval test run tests/evals/test_rag_pipeline.py --verbose
"""

import json
import os
import sys
import logging
import time

import pytest

from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import (
    AnswerRelevancyMetric,
    ContextualRecallMetric,
    ContextualRelevancyMetric,
)

# Local imports (path set by conftest.py)
from groq_judge import GroqJudgeModel
from ollama_generator import generate_response, check_ollama_health

# Backend imports (path set by conftest.py)
from app.services.rag.retriever import RAGRetriever
from app.db.chroma import get_repo_collection_name

logger = logging.getLogger(__name__)

# ── Constants ──
DATASET_PATH = os.path.join(os.path.dirname(__file__), "golden_dataset.json")
RESULTS_PATH = os.path.join(os.path.dirname(__file__), "eval_results.json")
BATCH_SIZE = 5  # Process test cases in batches of 5
BATCH_DELAY = 3  # Seconds to wait between batches


# ── Load golden dataset ──
def load_golden_dataset():
    with open(DATASET_PATH, "r") as f:
        return json.load(f)


# ── Build test cases by running RAG pipeline ──
def build_test_cases():
    """
    For each golden question:
      1. Retrieve context from ChromaDB
      2. Generate response with Ollama
      3. Build an LLMTestCase
    """
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY not set")

    if not check_ollama_health():
        raise RuntimeError("Ollama is not running on localhost:11434")

    dataset = load_golden_dataset()
    retriever = RAGRetriever(api_key=api_key)
    test_cases = []
    test_ids = []

    logger.info(f"Building {len(dataset)} test cases in batches of {BATCH_SIZE}...")

    for batch_start in range(0, len(dataset), BATCH_SIZE):
        batch = dataset[batch_start : batch_start + BATCH_SIZE]
        batch_num = (batch_start // BATCH_SIZE) + 1
        total_batches = (len(dataset) + BATCH_SIZE - 1) // BATCH_SIZE
        logger.info(f"  Batch {batch_num}/{total_batches}...")

        for item in batch:
            collection_name = get_repo_collection_name(item["repo_url"])

            # 1. Retrieve context chunks
            try:
                docs = retriever.get_relevant_documents(
                    collection_name, item["question"], k=5
                )
            except Exception as e:
                logger.warning(
                    f"  ⚠️  Retrieval failed for {item['id']}: {e}. Skipping."
                )
                continue

            retrieval_context = [doc.page_content for doc in docs]
            context_text = "\n\n".join(
                [
                    f"--- SOURCE: {doc.metadata.get('source', 'unknown')} ---\n{doc.page_content}"
                    for doc in docs
                ]
            )

            # 2. Generate response with Ollama
            try:
                actual_output = generate_response(item["question"], context_text)
            except Exception as e:
                logger.warning(
                    f"  ⚠️  Generation failed for {item['id']}: {e}. Skipping."
                )
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

            logger.info(f"    ✅ {item['id']}")

        # Brief pause between batches to be polite to embedding API
        if batch_start + BATCH_SIZE < len(dataset):
            time.sleep(BATCH_DELAY)

    logger.info(f"Built {len(test_cases)}/{len(dataset)} test cases successfully.")
    return test_cases, test_ids


# ── Initialize judge and metrics ──
judge = GroqJudgeModel(model_name="llama-3.3-70b-versatile")

# Thresholds:
#   Answer Relevancy  0.7 — the answer should be mostly relevant
#   Contextual Recall 0.5 — at least half the expected facts should be retrieved
#   Contextual Relevancy 0.5 — at least half the retrieved chunks should be relevant
answer_relevancy = AnswerRelevancyMetric(
    threshold=0.7,
    model=judge,
    include_reason=True,
    async_mode=False,  # Serialize to respect Groq rate limits
)

contextual_recall = ContextualRecallMetric(
    threshold=0.5,
    model=judge,
    include_reason=True,
    async_mode=False,
)

contextual_relevancy = ContextualRelevancyMetric(
    threshold=0.5,
    model=judge,
    include_reason=True,
    async_mode=False,
)

ALL_METRICS = [answer_relevancy, contextual_recall, contextual_relevancy]


# ── Build test cases at module load ──
TEST_CASES, TEST_IDS = build_test_cases()


# ── Parametrized test ──
@pytest.mark.parametrize(
    "test_case",
    TEST_CASES,
    ids=TEST_IDS,
)
def test_rag_quality(test_case: LLMTestCase):
    """Evaluate a single RAG test case against all 3 metrics."""
    assert_test(test_case, ALL_METRICS)


# ── Save results after all tests complete ──
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

        # Collect scores from the last metric run
        for metric in ALL_METRICS:
            entry["scores"][metric.__class__.__name__] = {
                "score": getattr(metric, "score", None),
                "threshold": metric.threshold,
                "reason": getattr(metric, "reason", None),
            }

        results.append(entry)

    summary = {
        "total_tests": len(TEST_CASES),
        "passed": session.testscollected - session.testsfailed if hasattr(session, "testsfailed") else "unknown",
        "failed": getattr(session, "testsfailed", "unknown"),
        "exit_status": exitstatus,
        "results": results,
    }

    with open(RESULTS_PATH, "w") as f:
        json.dump(summary, f, indent=2, default=str)

    logger.info(f"📊 Results saved to {RESULTS_PATH}")
