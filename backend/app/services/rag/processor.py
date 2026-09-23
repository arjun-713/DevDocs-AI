from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from app.services.rag.embeddings import embed_passages
from .ingestion.models import RepoDoc


class RAGProcessor:
    def __init__(self):
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
        Budget-guards bounded OpenAI embedding batches while prior batches are
        written to Chroma.
        """
        import asyncio
        import logging
        import os
        import time

        collection = chroma_client.get_or_create_collection(name=collection_name)
        batch_size = max(1, int(os.getenv("EMBEDDING_BATCH_SIZE", "64")))
        write_concurrency = max(1, min(2, int(os.getenv("CHROMA_WRITE_CONCURRENCY", "2"))))
        total_indexed = 0
        total_batches = (len(documents) + batch_size - 1) // batch_size
        pending_writes = set()

        async def write_batch(embeddings, texts, metadatas, ids):
            for attempt in range(3):
                try:
                    await asyncio.to_thread(
                        collection.upsert,
                        embeddings=embeddings,
                        documents=texts,
                        metadatas=metadatas,
                        ids=ids,
                    )
                    return len(ids)
                except Exception:
                    if attempt == 2:
                        raise
                    logging.warning("Chroma write failed; retrying idempotent upsert (%s/3)", attempt + 1)
                    await asyncio.sleep(0.25 * (2 ** attempt))

        async def record_completed(completed_tasks):
            nonlocal total_indexed
            for task in completed_tasks:
                total_indexed += task.result()
            if progress_callback and documents:
                pct = 50 + int((total_indexed / len(documents)) * 50)
                progress_callback(min(pct, 99))

        try:
            for batch_num, start in enumerate(range(0, len(documents), batch_size)):
                batch = documents[start:start + batch_size]
                texts = [doc.page_content for doc in batch]
                metadatas = [doc.metadata for doc in batch]
                ids = [f"{doc.metadata['source']}_chunk_{start + i}" for i, doc in enumerate(batch)]
                embeddings = await asyncio.to_thread(embed_passages, texts)
                pending_writes.add(asyncio.create_task(write_batch(embeddings, texts, metadatas, ids)))

                # Keep memory and Chroma request pressure bounded. While these writes
                # run, the next batch is embedded on a worker thread.
                if len(pending_writes) >= write_concurrency:
                    completed, pending_writes = await asyncio.wait(
                        pending_writes, return_when=asyncio.FIRST_COMPLETED
                    )
                    await record_completed(completed)

                logging.info("Prepared batch %s/%s", batch_num + 1, total_batches)

            while pending_writes:
                completed, pending_writes = await asyncio.wait(
                    pending_writes, return_when=asyncio.FIRST_COMPLETED
                )
                await record_completed(completed)
        except Exception:
            for task in pending_writes:
                task.cancel()
            await asyncio.gather(*pending_writes, return_exceptions=True)
            raise

        return total_indexed
