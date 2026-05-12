"""
Ollama response generator for RAG evaluation.

Calls a local Ollama instance (llama3.2:3b) to generate responses
from retrieved context, simulating the production RAG pipeline
but with a local model instead of Gemini.
"""

import requests
import logging

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = "http://localhost:11434"

SYSTEM_PROMPT_TEMPLATE = """You are DevDocs AI, an expert technical documentation assistant.
Your goal is to answer questions about a codebase using the provided documentation snippets.

STRICT RULES:
1. ONLY use the information provided in the context below.
2. If the answer is not in the context, say: "I couldn't find information about that in the indexed documentation."
3. DO NOT include file names, file paths, or source references anywhere in your answer.
4. Write clean, concise answers. Use short paragraphs.
5. Use Markdown formatting: **bold** for key terms, bullet points for lists, `backticks` for code.

CONTEXT FROM REPOSITORY:
{context}
"""


def check_ollama_health() -> bool:
    """Check if Ollama is running and responsive."""
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        return resp.status_code == 200
    except requests.ConnectionError:
        return False


def generate_response(
    question: str,
    context: str,
    model: str = "llama3.2:3b",
) -> str:
    """
    Generate a RAG response using Ollama.

    Args:
        question: The user's question.
        context: Formatted retrieval context string.
        model: Ollama model name to use.

    Returns:
        The generated response text.
    """
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(context=context)

    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": model,
                "prompt": f"User Question: {question}",
                "system": system_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.2,
                    "num_predict": 512,
                },
            },
            timeout=120,
        )
        response.raise_for_status()
        return response.json()["response"]

    except requests.ConnectionError:
        logger.error("Cannot connect to Ollama. Is it running on localhost:11434?")
        raise RuntimeError(
            "Ollama is not running. Start it with: ollama serve"
        )
    except Exception as e:
        logger.error(f"Ollama generation failed: {e}")
        raise
