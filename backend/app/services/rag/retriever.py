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

    @staticmethod
    def _text_overlap_ratio(a: str, b: str) -> float:
        """Returns the ratio of overlapping content between two strings."""
        shorter, longer = (a, b) if len(a) <= len(b) else (b, a)
        if not shorter:
            return 0.0
        # Check if the shorter text is largely contained in the longer text
        # Use a sliding window of the shorter text's length
        shorter_words = set(shorter.lower().split())
        longer_words = set(longer.lower().split())
        if not shorter_words:
            return 0.0
        overlap = len(shorter_words & longer_words) / len(shorter_words)
        return overlap

    def get_relevant_documents(self, repo_collection_name: str, query: str, k: int = 5) -> List[Document]:
        """
        Retrieves the top K most relevant documentation chunks from ChromaDB,
        with deduplication to prevent overlapping chunks from polluting context.
        """
        collection = self.client.get_collection(name=repo_collection_name)
        
        # Embed the query
        query_embedding = self.embeddings.embed_query(query)
        
        # Fetch more candidates than needed so we can deduplicate
        fetch_count = min(k * 3, collection.count())
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=fetch_count
        )
        
        candidates = []
        if results['documents']:
            for i in range(len(results['documents'][0])):
                candidates.append(Document(
                    page_content=results['documents'][0][i],
                    metadata=results['metadatas'][0][i]
                ))
        
        # Deduplicate: skip chunks that overlap >60% with an already-selected chunk
        selected: List[Document] = []
        for candidate in candidates:
            is_duplicate = False
            for existing in selected:
                overlap = self._text_overlap_ratio(candidate.page_content, existing.page_content)
                if overlap > 0.6:
                    is_duplicate = True
                    break
            if not is_duplicate:
                selected.append(candidate)
            if len(selected) >= k:
                break
        
        return selected

