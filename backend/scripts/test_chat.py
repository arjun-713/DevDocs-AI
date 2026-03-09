import asyncio
import sys
import os
from dotenv import load_dotenv

# Add the backend directory to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Explicitly load .env from the root directory
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

from app.services.rag.retriever import RAGRetriever
from app.services.rag.llm import LLMService
from app.db.chroma import get_repo_collection_name

async def test_chat_pipeline():
    # Use the repo we just successfully indexed in the previous test
    test_repo = "https://github.com/octocat/Spoon-Knife"
    test_query = "What is in the README file?"
    
    print(f"--- Testing Chat for {test_repo} ---")
    print(f"Query: {test_query}")
    
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("✗ Error: API Key not found in .env")
        return

    try:
        collection_name = get_repo_collection_name(test_repo)
        
        # 1. Retrieve
        print("\nStep 1: Retrieving context...")
        retriever = RAGRetriever(api_key=api_key)
        docs = retriever.get_relevant_documents(collection_name, test_query)
        print(f"✓ Found {len(docs)} relevant chunks.")
        for doc in docs:
            print(f"  - From: {doc.metadata.get('source')}")

        # 2. Stream Chat
        print("\nStep 2: Streaming answer from Gemini 2.5 Flash...")
        llm_service = LLMService(api_key=api_key)
        
        print("\nAnswer: ", end="", flush=True)
        async for chunk in llm_service.stream_answer(test_query, docs):
            print(chunk, end="", flush=True)
        print("\n")

    except Exception as e:
        print(f"\n✗ Chat failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_chat_pipeline())
