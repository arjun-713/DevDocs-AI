from typing import List, Optional
from pydantic import BaseModel

class RepoDoc(BaseModel):
    """Represents a single documentation file from a repository."""
    path: str
    url: str
    content: Optional[str] = None

class CrawlerResult(BaseModel):
    """Statistics and results from the crawling process."""
    repo_url: str
    files_found: int
    files: List[RepoDoc]
