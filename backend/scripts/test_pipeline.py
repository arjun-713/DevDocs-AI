import asyncio
import sys
import os
from dotenv import load_dotenv

# Add the backend directory to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Explicitly load .env from the root directory
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

from app.services.rag.ingestion.crawler import GitHubCrawler
from app.services.rag.processor import RAGProcessor
from app.db.chroma import get_chroma_client, get_repo_collection_name

async def test_full_pipeline():
    # A small repository for quick testing
    test_repo = "https://github.com/octocat/Spoon-Knife"
    # If the above doesn't work, we'll try something like 'https://github.com/github/helloworld'
    
    print(f"--- Testing Pipeline for {test_repo} ---")
    
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("✗ Error: API Key (GOOGLE_API_KEY or GEMINI_API_KEY) not found in .env")
        return

    try:
        # 1. Crawl
        print("Step 1: Crawling...")
        async with GitHubCrawler() as crawler:
            crawler_result = await crawler.crawl(test_repo)
        print(f"✓ Found {crawler_result.files_found} files.")

        # 2. Process
        print("Step 2: Chunking...")
        processor = RAGProcessor(api_key=api_key)
        chunks = processor.process_docs(crawler_result.files)
        print(f"✓ Created {len(chunks)} chunks.")

        # 3. Index
        print("Step 3: Indexing in ChromaDB...")
        client = get_chroma_client()
        collection_name = get_repo_collection_name(test_repo)
        
        indexed_count = await processor.index_documents(client, collection_name, chunks)
        print(f"✓ Successfully indexed {indexed_count} chunks into collection '{collection_name}'.")
        
        # 4. Verify in Chroma
        collection = client.get_collection(name=collection_name)
        count = collection.count()
        print(f"✓ Verified: Collection '{collection_name}' now has {count} items.")

    except Exception as e:
        print(f"✗ Pipeline failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_full_pipeline())
