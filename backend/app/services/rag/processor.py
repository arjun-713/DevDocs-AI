from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
from .ingestion.models import RepoDoc


class RAGProcessor:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=api_key
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            is_separator_regex=False,
        )

    def process_docs(self, repo_docs: List[RepoDoc]) -> List[Document]:
        """
        Splits RepoDocs into chunks and convert to LangChain Documents.
        """
        all_chunks = []
        for doc in repo_docs:
            if not doc.content:
                continue
            
            # Create chunks for this file
            chunks = self.text_splitter.split_text(doc.content)
            
            for i, chunk_text in enumerate(chunks):
                all_chunks.append(Document(
                    page_content=chunk_text,
                    metadata={
                        "source": doc.path,
                        "url": doc.url,
                        "chunk_index": i
                    }
                ))
        return all_chunks

    async def index_documents(self, chroma_client, collection_name: str, documents: List[Document]):
        """
        Embeds and stores documents in ChromaDB.
        Uses small batches with exponential backoff to respect free-tier rate limits.
        """
        import asyncio
        import logging
        import re

        collection = chroma_client.get_or_create_collection(name=collection_name)
        
        # Small batch size to stay under 100 RPM free tier quota
        batch_size = 10
        total_indexed = 0
        total_batches = (len(documents) + batch_size - 1) // batch_size
        
        for batch_num, start in enumerate(range(0, len(documents), batch_size)):
            batch = documents[start:start + batch_size]
            
            texts = [doc.page_content for doc in batch]
            metadatas = [doc.metadata for doc in batch]
            ids = [f"{doc.metadata['source']}_chunk_{start + i}" for i, doc in enumerate(batch)]
            
            # Retry loop with exponential backoff
            max_retries = 3
            for attempt in range(max_retries + 1):
                try:
                    embeddings = await self.embeddings.aembed_documents(texts)
                    collection.add(
                        embeddings=embeddings,
                        documents=texts,
                        metadatas=metadatas,
                        ids=ids
                    )
                    total_indexed += len(ids)
                    logging.info(f"Indexed batch {batch_num + 1}/{total_batches} ({total_indexed}/{len(documents)} chunks)")
                    break  # Success — exit retry loop
                except Exception as e:
                    error_str = str(e)
                    if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str:
                        # Try to extract retry delay from the error message
                        delay_match = re.search(r'retry in (\d+)', error_str, re.IGNORECASE)
                        wait_time = int(delay_match.group(1)) + 5 if delay_match else min(30 * (2 ** attempt), 120)
                        logging.warning(f"Rate limited on batch {batch_num + 1}. Waiting {wait_time}s before retry {attempt + 1}/{max_retries}...")
                        await asyncio.sleep(wait_time)
                        if attempt == max_retries:
                            raise  # Exhausted retries
                    else:
                        raise  # Non-rate-limit error, propagate immediately
            
            # Inter-batch delay to stay under quota
            await asyncio.sleep(3)
        
        return total_indexed
