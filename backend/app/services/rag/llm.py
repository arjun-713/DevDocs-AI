from typing import List, AsyncGenerator
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.documents import Document

class LLMService:
    def __init__(self, api_key: str):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key,
            streaming=True,
            temperature=0.2
        )

    def _build_prompt(self, query: str, context_docs: List[Document]) -> List[SystemMessage | HumanMessage]:
        """
        Constructs the RAG prompt with retrieved context.
        """
        context_text = "\n\n".join([
            f"--- SOURCE: {doc.metadata.get('source')} ---\n{doc.page_content}"
            for doc in context_docs
        ])

        system_prompt = f"""You are DevDocs AI, an expert technical documentation assistant.
Your goal is to answer questions about a codebase using the provided documentation snippets.

STRICT RULES:
1. ONLY use the information provided in the context below.
2. If the answer is not in the context, say: "I couldn't find information about that in the indexed documentation."
3. DO NOT include file names, file paths, or source references anywhere in your answer. Sources are displayed separately by the UI — never write things like "(README.md)" or "(docs/guide.md)" in your text.
4. Write clean, concise answers. Use short paragraphs. Avoid repeating yourself.
5. Use Markdown formatting: **bold** for key terms, bullet points for lists, `backticks` for code.
6. Never repeat the same paragraph or sentence twice.

CONTEXT FROM REPOSITORY:
{context_text}
"""
        return [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"User Question: {query}")
        ]

    async def stream_answer(self, query: str, context_docs: List[Document]) -> AsyncGenerator[str, None]:
        """
        Streams the generated answer token by token.
        """
        messages = self._build_prompt(query, context_docs)
        
        async for chunk in self.llm.astream(messages):
            if chunk.content:
                yield chunk.content
