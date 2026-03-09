from typing import List
from app.db.chroma import get_chroma_client
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document

class RAGRetriever:
    def __init__(self, api_key: str):
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=api_key
        )
        self.client = get_chroma_client()

    def get_relevant_documents(self, repo_collection_name: str, query: str, k: int = 5) -> List[Document]:
        """
        Retrieves the top K most relevant documentation chunks from ChromaDB.
        """
        collection = self.client.get_collection(name=repo_collection_name)
        
        # Embed the query
        query_embedding = self.embeddings.embed_query(query)
        
        # Search the collection
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=k
        )
        
        documents = []
        if results['documents']:
            for i in range(len(results['documents'][0])):
                documents.append(Document(
                    page_content=results['documents'][0][i],
                    metadata=results['metadatas'][0][i]
                ))
        
        return documents
