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
        Processes in batches of 100 to avoid API limits.
        """
        collection = chroma_client.get_or_create_collection(name=collection_name)
        
        batch_size = 100
        total_indexed = 0
        
        for start in range(0, len(documents), batch_size):
            batch = documents[start:start + batch_size]
            
            texts = [doc.page_content for doc in batch]
            metadatas = [doc.metadata for doc in batch]
            ids = [f"{doc.metadata['source']}_chunk_{start + i}" for i, doc in enumerate(batch)]
            
            embeddings = self.embeddings.embed_documents(texts)
            
            collection.add(
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas,
                ids=ids
            )
            total_indexed += len(ids)
        
        return total_indexed
