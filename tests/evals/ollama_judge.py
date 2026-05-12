"""
Ollama LLM wrapper for DeepEval judge.

Uses a local Ollama model (qwen2.5:3b) as the LLM-as-a-Judge.
No API keys needed — runs entirely on the CI runner.
"""

import os
import time
import json
import logging
from typing import Optional, Union

import requests
from deepeval.models import DeepEvalBaseLLM
from pydantic import BaseModel

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = "http://localhost:11434"


class OllamaJudgeModel(DeepEvalBaseLLM):
    """DeepEval-compatible wrapper around a local Ollama model for judging."""

    def __init__(self, model_name: str = "qwen2.5:3b"):
        self._model_name = model_name

    def load_model(self):
        return self._model_name

    def generate(
        self, prompt: str, schema: Optional[type[BaseModel]] = None
    ) -> Union[str, BaseModel]:
        payload = {
            "model": self._model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0,
                "num_predict": 4096,
            },
        }

        if schema is not None:
            payload["format"] = "json"
            schema_json = schema.model_json_schema()
            payload["prompt"] = (
                prompt
                + f"\n\nYou MUST respond with valid JSON matching this schema:\n{json.dumps(schema_json)}"
            )

        try:
            response = requests.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json=payload,
                timeout=300,
            )
            response.raise_for_status()
            content = response.json()["response"]

            if schema is not None:
                return self._parse_schema(content, schema)
            return content

        except requests.ConnectionError:
            raise RuntimeError(
                f"Cannot connect to Ollama at {OLLAMA_BASE_URL}. Is it running?"
            )

    def _parse_schema(self, content: str, schema: type[BaseModel]) -> BaseModel:
        """Parse response into schema, with fallback JSON extraction."""
        try:
            return schema.model_validate_json(content)
        except Exception:
            # Try to extract JSON from the response
            start = content.find("{")
            end = content.rfind("}")
            if start != -1 and end != -1:
                json_str = content[start : end + 1]
                return schema.model_validate_json(json_str)
            raise

    async def a_generate(
        self, prompt: str, schema: Optional[type[BaseModel]] = None
    ) -> Union[str, BaseModel]:
        return self.generate(prompt, schema)

    def get_model_name(self) -> str:
        return self._model_name
