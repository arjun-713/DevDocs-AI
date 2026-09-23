import os
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from app.services.rag import embedding_budget
from app.services.rag import embeddings


class EmbeddingBudgetTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.env = patch.dict(
            os.environ,
            {"EMBEDDING_BUDGET_DB_PATH": str(Path(self.temp_dir.name) / "budget.sqlite3")},
        )
        self.env.start()

    def tearDown(self):
        self.env.stop()
        self.temp_dir.cleanup()

    def test_budget_is_fifty_cents_at_current_model_rate(self):
        self.assertEqual(embedding_budget.MAX_EMBEDDING_TOKENS, 25_000_000)

    def test_reservation_and_settlement_update_remaining_budget(self):
        reservation = embedding_budget.reserve_embedding_tokens(10_000)
        embedding_budget.settle_embedding_reservation(reservation, 8_500)

        usage = embedding_budget.get_embedding_budget_usage()
        self.assertEqual(usage["used_tokens"], 8_500)
        self.assertEqual(usage["remaining_tokens"], 24_991_500)

    def test_budget_rejects_overspend_before_reservation(self):
        with self.assertRaises(embedding_budget.EmbeddingBudgetExceeded):
            embedding_budget.reserve_embedding_tokens(25_000_001)
        self.assertEqual(embedding_budget.get_embedding_budget_usage()["used_tokens"], 0)

    def test_parallel_reservations_cannot_exceed_the_shared_cap(self):
        def reserve_half_budget(_):
            try:
                return embedding_budget.reserve_embedding_tokens(13_000_000)
            except embedding_budget.EmbeddingBudgetExceeded:
                return None

        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(reserve_half_budget, range(2)))

        self.assertEqual(sum(result is not None for result in results), 1)
        self.assertEqual(embedding_budget.get_embedding_budget_usage()["used_tokens"], 13_000_000)

    def test_ambiguous_failed_request_keeps_its_reservation(self):
        reservation = embedding_budget.reserve_embedding_tokens(2_000)
        embedding_budget.mark_embedding_reservation_uncertain(reservation)
        self.assertEqual(embedding_budget.get_embedding_budget_usage()["used_tokens"], 2_000)

    def test_embedding_uses_expected_model_and_settles_api_reported_usage(self):
        expected_vector = [0.125] * 1536

        class FakeEmbeddings:
            def create(self, **kwargs):
                self.kwargs = kwargs
                return SimpleNamespace(
                    data=[SimpleNamespace(index=0, embedding=expected_vector)],
                    usage=SimpleNamespace(prompt_tokens=7),
                )

        fake_client = SimpleNamespace(embeddings=FakeEmbeddings())
        with patch.object(embeddings, "_client", fake_client):
            result = embeddings.embed_passages(["small public test text"])

        self.assertEqual(result, [expected_vector])
        self.assertEqual(fake_client.embeddings.kwargs["model"], "text-embedding-3-small")
        self.assertEqual(embedding_budget.get_embedding_budget_usage()["used_tokens"], 7)

    def test_overlong_inputs_fail_before_reserving_budget(self):
        long_text = "word " * 9000
        with self.assertRaises(ValueError):
            embeddings.embed_passages([long_text])
        self.assertEqual(embedding_budget.get_embedding_budget_usage()["used_tokens"], 0)


if __name__ == "__main__":
    unittest.main()
