import asyncio
import sys
import os

# Add the backend/app directory to the path so we can import modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.rag.ingestion.crawler import GitHubCrawler

async def main():
    # Use a small, well-known repo for testing
    test_repo = "https://github.com/google/generative-ai-python"
    print(f"--- Crawling {test_repo} ---")
    
    async with GitHubCrawler() as crawler:
        try:
            result = await crawler.crawl(test_repo)
            print(f"✓ Found {result.files_found} documentation files.")
            
            # Print the first 5 file paths found
            print("\nPreview of files found:")
            for doc in result.files[:5]:
                content_preview = (doc.content[:100] + "...") if doc.content else "No content"
                print(f"- {doc.path} ({len(doc.content) if doc.content else 0} chars)")
                # print(f"  Preview: {content_preview}")
                
        except Exception as e:
            print(f"✗ Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
