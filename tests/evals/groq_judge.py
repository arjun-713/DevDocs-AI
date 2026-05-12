"""
Groq LLM wrapper for DeepEval.

Uses Groq's API (llama-3.3-70b-versatile) as the judge model for
evaluating RAG pipeline quality. Includes rate limiting to stay
within Groq's free tier limits (~30 req/min).
"""

import os
import time
import logging
from typing import Optional, Union

from deepeval.models import DeepEvalBaseLLM
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class GroqJudgeModel(DeepEvalBaseLLM):
    """DeepEval-compatible wrapper around Groq's API for LLM-as-a-Judge."""

    # Class-level rate limiter shared across all instances
    _last_call_time: float = 0
    _min_interval: float = 2.5  # ~24 calls/min, safely under 30/min limit

    def __init__(self, model_name: str = "llama-3.3-70b-versatile"):
        self._model_name = model_name
        self._client = None

    def load_model(self):
        """Lazily initialize the Groq client."""
        if self._client is None:
            from groq import Groq

            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise ValueError("GROQ_API_KEY environment variable is not set")
            self._client = Groq(api_key=api_key)
        return self._client

    def _rate_limit(self):
        """Enforce minimum interval between API calls."""
        now = time.time()
        elapsed = now - GroqJudgeModel._last_call_time
        if elapsed < self._min_interval:
            sleep_time = self._min_interval - elapsed
            logger.debug(f"Rate limiting: sleeping {sleep_time:.1f}s")
            time.sleep(sleep_time)
        GroqJudgeModel._last_call_time = time.time()

    def generate(
        self, prompt: str, schema: Optional[type[BaseModel]] = None
    ) -> Union[str, BaseModel]:
        """
        Generate a response from Groq.

        If schema is provided, returns a parsed Pydantic model instance.
        Otherwise returns raw text.
        """
        client = self.load_model()
        self._rate_limit()

        messages = [{"role": "user", "content": prompt}]

        kwargs = {
            "model": self._model_name,
            "messages": messages,
            "temperature": 0,
            "max_tokens": 4096,
        }

        if schema is not None:
            kwargs["response_format"] = {"type": "json_object"}
            # Add schema hint to help the model produce valid JSON
            schema_json = schema.model_json_schema()
            messages[0]["content"] = (
                prompt
                + f"\n\nYou MUST respond with valid JSON matching this schema:\n{schema_json}"
            )

        try:
            response = client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content

            if schema is not None:
                return schema.model_validate_json(content)
            return content

        except Exception as e:
            logger.error(f"Groq API error: {e}")
            # Retry once after a longer wait
            time.sleep(5)
            self._rate_limit()
            response = client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content

            if schema is not None:
                return schema.model_validate_json(content)
            return content

    async def a_generate(
        self, prompt: str, schema: Optional[type[BaseModel]] = None
    ) -> Union[str, BaseModel]:
        """Async generate - delegates to sync for simplicity with rate limiting."""
        return self.generate(prompt, schema)

    def get_model_name(self) -> str:
        return self._model_name
