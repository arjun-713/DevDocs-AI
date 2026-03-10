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
            chunk_size=1500,
            chunk_overlap=150,
            length_function=len,
            is_separator_regex=False,
        )

    def process_docs(self, repo_docs: List[RepoDoc]) -> List[Document]:
        """
        Splits RepoDocs into chunks and convert to LangChain Documents.
        Caps individual files at 50KB to avoid runaway chunking on huge files.
        """
        MAX_FILE_SIZE = 50_000  # 50KB cap per file

        all_chunks = []
        for doc in repo_docs:
            if not doc.content:
                continue

            content = doc.content
            if len(content) > MAX_FILE_SIZE:
                content = content[:MAX_FILE_SIZE]

            # Create chunks for this file
            chunks = self.text_splitter.split_text(content)

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

    async def index_documents(self, chroma_client, collection_name: str, documents: List[Document],
                              progress_callback=None):
        """
        Embeds and stores documents in ChromaDB.
        Uses batched embedding with retry logic for rate limits.
        """
        import asyncio
        import logging
        import re

        collection = chroma_client.get_or_create_collection(name=collection_name)

        # Larger batches = fewer API calls = faster indexing
        batch_size = 50
        total_indexed = 0
        total_batches = (len(documents) + batch_size - 1) // batch_size

        for batch_num, start in enumerate(range(0, len(documents), batch_size)):
            batch = documents[start:start + batch_size]

            texts = [doc.page_content for doc in batch]
            metadatas = [doc.metadata for doc in batch]
            ids = [f"{doc.metadata['source']}_chunk_{start + i}" for i, doc in enumerate(batch)]

            # Retry loop with exponential backoff
            max_retries = 5
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
                    logging.info(
                        f"Indexed batch {batch_num + 1}/{total_batches} ({total_indexed}/{len(documents)} chunks)")

                    # Report progress
                    if progress_callback:
                        pct = 50 + int((total_indexed / len(documents)) * 50)
                        progress_callback(min(pct, 99))

                    break  # Success — exit retry loop
                except Exception as e:
                    error_str = str(e)
                    if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str:
                        # Try to extract retry delay from the error message
                        delay_match = re.search(r'retry in (\d+)', error_str, re.IGNORECASE)
                        wait_time = int(delay_match.group(1)) + 2 if delay_match else min(10 * (2 ** attempt), 60)
                        logging.warning(
                            f"Rate limited on batch {batch_num + 1}. Waiting {wait_time}s before retry {attempt + 1}/{max_retries}...")
                        await asyncio.sleep(wait_time)
                        if attempt == max_retries:
                            raise  # Exhausted retries
                    else:
                        raise  # Non-rate-limit error, propagate immediately

            # Minimal inter-batch delay (just enough to be polite)
            await asyncio.sleep(0.5)

        return total_indexed
