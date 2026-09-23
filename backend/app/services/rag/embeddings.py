"""OpenAI text embeddings guarded by a persistent $0.50 usage budget."""

import math
import os
import threading
import time

import tiktoken
from openai import OpenAI

from app.services.rag.embedding_budget import (
    mark_embedding_reservation_uncertain,
    release_rejected_embedding_reservation,
    reserve_embedding_tokens,
    settle_embedding_reservation,
)

MODEL_NAME = "text-embedding-3-small"
MAX_INPUT_TOKENS = 8192
_client_lock = threading.Lock()
_request_slots = threading.BoundedSemaphore(2)
_client: OpenAI | None = None
_tokenizer = tiktoken.get_encoding("cl100k_base")


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        with _client_lock:
            if _client is None:
                _client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"), max_retries=0)
    return _client


def count_input_tokens(texts: list[str]) -> int:
    """Count model input tokens locally, before any billable API request."""
    return sum(len(_tokenizer.encode(text, disallowed_special=())) for text in texts)


def _reserve_with_margin(tokens: int) -> str:
    # cl100k_base is the model tokenizer; a margin protects against minor
    # tokenizer/accounting differences without meaningfully reducing capacity.
    reserved_tokens = tokens + max(16, math.ceil(tokens * 0.01))
    return reserve_embedding_tokens(reserved_tokens)


def _embed(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    token_counts = [len(_tokenizer.encode(text, disallowed_special=())) for text in texts]
    if any(tokens > MAX_INPUT_TOKENS for tokens in token_counts):
        raise ValueError(f"Each embedding input must be at most {MAX_INPUT_TOKENS} tokens")
    reservation_id = _reserve_with_margin(sum(token_counts))
    try:
        with _request_slots:
            for attempt in range(4):
                try:
                    response = _get_client().embeddings.create(
                        model=MODEL_NAME,
                        input=texts,
                        encoding_format="float",
                    )
                    break
                except Exception as error:
                    status_code = getattr(error, "status_code", None)
                    error_code = getattr(error, "code", None)
                    if status_code == 429 and error_code != "insufficient_quota" and attempt < 3:
                        time.sleep(2 ** attempt)
                        continue
                    raise
    except Exception as error:
        # Provider-side 4xx rejections are definite non-billable failures. For
        # transport/server errors, keep the reservation if the request outcome
        # is ambiguous because the provider may have processed it.
        status_code = getattr(error, "status_code", None)
        if status_code is not None and 400 <= status_code < 500:
            release_rejected_embedding_reservation(reservation_id)
        else:
            mark_embedding_reservation_uncertain(reservation_id)
        raise

    actual_tokens = response.usage.prompt_tokens
    settle_embedding_reservation(reservation_id, actual_tokens)
    return [item.embedding for item in sorted(response.data, key=lambda item: item.index)]


def embed_passages(texts: list[str]) -> list[list[float]]:
    """Embed repository chunks; every request is budget-reserved before send."""
    return _embed(texts)


def embed_query(query: str) -> list[float]:
    """Embed a chat query through the same capped model and usage ledger."""
    return _embed([query])[0]
