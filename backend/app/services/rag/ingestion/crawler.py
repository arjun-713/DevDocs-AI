import httpx
import asyncio
from typing import List, Dict
from .models import RepoDoc, CrawlerResult
from .utils import parse_github_url, is_doc_file

class GitHubCrawler:
    def __init__(self, token: str = None):
        self.headers = {}
        if token:
            self.headers["Authorization"] = f"token {token}"
        self.client = httpx.AsyncClient(headers=self.headers, timeout=30.0, follow_redirects=True)

    async def get_repo_tree(self, owner: str, repo: str, branch: str = "main") -> List[Dict]:
        """
        Fetches the recursive file tree using GitHub Trees API.
        """
        url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
        response = await self.client.get(url)
        response.raise_for_status()
        return response.json().get("tree", [])

    async def fetch_file_content(self, owner: str, repo: str, path: str, branch: str = "main") -> str:
        """
        Fetches the raw content of a file from raw.githubusercontent.com.
        """
        url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
        response = await self.client.get(url)
        if response.status_code == 200:
            return response.text
        return ""

    async def crawl(self, repo_url: str, branch: str = "main") -> CrawlerResult:
        """
        Main entry point to crawl a repository.
        """
        parsed = parse_github_url(repo_url)
        if not parsed:
            raise ValueError(f"Invalid GitHub URL: {repo_url}")
        
        owner, repo = parsed
        tree = await self.get_repo_tree(owner, repo, branch)
        
        # Filter for documentation files
        doc_files = [
            RepoDoc(path=item["path"], url=f"https://github.com/{owner}/{repo}/blob/{branch}/{item['path']}")
            for item in tree if item["type"] == "blob" and is_doc_file(item["path"])
        ]

        # Fetch contents in parallel
        tasks = [
            self.fetch_file_content(owner, repo, doc.path, branch)
            for doc in doc_files
        ]
        contents = await asyncio.gather(*tasks)

        for doc, content in zip(doc_files, contents):
            doc.content = content

        return CrawlerResult(
            repo_url=repo_url,
            files_found=len(doc_files),
            files=doc_files
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
