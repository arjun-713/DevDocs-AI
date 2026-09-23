"""Persistent, concurrency-safe spending guard for OpenAI embeddings."""

import os
import sqlite3
import uuid
from contextlib import closing
from pathlib import Path

EMBEDDING_BUDGET_USD = 0.50
EMBEDDING_PRICE_PER_MILLION_TOKENS_USD = 0.02
MAX_EMBEDDING_TOKENS = int(
    EMBEDDING_BUDGET_USD * 1_000_000 / EMBEDDING_PRICE_PER_MILLION_TOKENS_USD
)


class EmbeddingBudgetExceeded(RuntimeError):
    """Raised before an API call would exceed the configured lifetime cap."""

    def __init__(self, requested_tokens: int, remaining_tokens: int):
        self.requested_tokens = requested_tokens
        self.remaining_tokens = remaining_tokens
        super().__init__(
            "OpenAI embedding budget exhausted: "
            f"requested {requested_tokens} tokens; {remaining_tokens} remain "
            f"of the {MAX_EMBEDDING_TOKENS}-token ($0.50) lifetime cap."
        )


def _database_path() -> Path:
    configured = os.getenv("EMBEDDING_BUDGET_DB_PATH")
    if configured:
        path = Path(configured)
    else:
        path = Path(__file__).resolve().parents[3] / "data" / "embedding_budget.sqlite3"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(_database_path(), timeout=30, isolation_level=None)
    connection.execute("PRAGMA busy_timeout = 30000")
    connection.execute(
        """CREATE TABLE IF NOT EXISTS embedding_budget_reservations (
            reservation_id TEXT PRIMARY KEY,
            tokens INTEGER NOT NULL CHECK(tokens >= 0),
            status TEXT NOT NULL CHECK(status IN ('reserved', 'charged', 'uncertain'))
        )"""
    )
    return connection


def reserve_embedding_tokens(estimated_tokens: int) -> str:
    """Atomically reserve estimated tokens before sending text to the API.

    An unresolved request remains reserved after an exception: this is
    intentionally conservative because the client may lose a response after
    the provider has processed the request.
    """
    tokens = max(0, int(estimated_tokens))
    reservation_id = uuid.uuid4().hex
    with closing(_connect()) as connection:
        connection.execute("BEGIN IMMEDIATE")
        used = connection.execute(
            "SELECT COALESCE(SUM(tokens), 0) FROM embedding_budget_reservations"
        ).fetchone()[0]
        remaining = max(0, MAX_EMBEDDING_TOKENS - used)
        if tokens > remaining:
            connection.rollback()
            raise EmbeddingBudgetExceeded(tokens, remaining)
        connection.execute(
            "INSERT INTO embedding_budget_reservations VALUES (?, ?, 'reserved')",
            (reservation_id, tokens),
        )
        connection.commit()
    return reservation_id


def settle_embedding_reservation(reservation_id: str, actual_tokens: int) -> None:
    """Replace a successful request's estimate with provider-reported usage."""
    actual = max(0, int(actual_tokens))
    with closing(_connect()) as connection:
        connection.execute("BEGIN IMMEDIATE")
        row = connection.execute(
            "SELECT tokens, status FROM embedding_budget_reservations WHERE reservation_id = ?",
            (reservation_id,),
        ).fetchone()
        if row is None or row[1] != "reserved":
            connection.rollback()
            raise ValueError("Unknown or already-settled embedding budget reservation")
        # The preflight estimate includes a safety margin. In the unlikely event
        # provider usage exceeds it, keep the actual usage recorded truthfully.
        connection.execute(
            "UPDATE embedding_budget_reservations SET tokens = ?, status = 'charged' "
            "WHERE reservation_id = ?",
            (actual, reservation_id),
        )
        connection.commit()


def mark_embedding_reservation_uncertain(reservation_id: str) -> None:
    """Keep an unsuccessful/ambiguous request charged against the reserved cap."""
    with closing(_connect()) as connection:
        connection.execute(
            "UPDATE embedding_budget_reservations SET status = 'uncertain' "
            "WHERE reservation_id = ? AND status = 'reserved'",
            (reservation_id,),
        )


def release_rejected_embedding_reservation(reservation_id: str) -> None:
    """Release budget for a definite provider 4xx rejection (no embedding made)."""
    with closing(_connect()) as connection:
        connection.execute(
            "DELETE FROM embedding_budget_reservations "
            "WHERE reservation_id = ? AND status = 'reserved'",
            (reservation_id,),
        )


def get_embedding_budget_usage() -> dict[str, int | float]:
    """Return safe accounting totals; never reads or returns credentials."""
    with closing(_connect()) as connection:
        used = connection.execute(
            "SELECT COALESCE(SUM(tokens), 0) FROM embedding_budget_reservations"
        ).fetchone()[0]
        uncertain = connection.execute(
            "SELECT COUNT(*) FROM embedding_budget_reservations WHERE status = 'uncertain'"
        ).fetchone()[0]
    return {
        "used_tokens": used,
        "remaining_tokens": max(0, MAX_EMBEDDING_TOKENS - used),
        "budget_usd": EMBEDDING_BUDGET_USD,
        "estimated_used_usd": round(
            used * EMBEDDING_PRICE_PER_MILLION_TOKENS_USD / 1_000_000, 8
        ),
        "uncertain_requests": uncertain,
    }
