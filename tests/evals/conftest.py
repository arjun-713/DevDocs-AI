"""
Pytest conftest for DeepEval RAG evaluation.

Sets up paths and shared fixtures.
"""

import os
import sys

# ── Path setup ──
# Add backend to Python path so we can import app modules
BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "backend")
sys.path.insert(0, BACKEND_DIR)

# Add tests/evals to path for local imports (groq_judge, ollama_generator)
EVALS_DIR = os.path.dirname(__file__)
sys.path.insert(0, EVALS_DIR)

# Load environment variables from project root
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
