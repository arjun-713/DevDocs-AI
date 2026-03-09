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

    async def get_default_branch(self, owner: str, repo: str) -> str:
        url = f"https://api.github.com/repos/{owner}/{repo}"
        response = await self.client.get(url)
        if response.status_code == 200:
            return response.json().get("default_branch", "main")
        return "main"

    async def get_repo_tree(self, owner: str, repo: str, branch: str) -> List[Dict]:
        """
        Fetches the recursive file tree using GitHub Trees API.
        """
        url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
        response = await self.client.get(url)
        response.raise_for_status()
        return response.json().get("tree", [])

    async def fetch_file_content(self, owner: str, repo: str, path: str, branch: str, semaphore: asyncio.Semaphore) -> str:
        """
        Fetches raw content with semaphore control to prevent rate limiting.
        """
        async with semaphore:
            url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
            try:
                response = await self.client.get(url)
                if response.status_code == 200:
                    return response.text
            except Exception:
                pass # Silently skip failed individual files
            return ""

    async def crawl(self, repo_url: str, branch: str = "main") -> CrawlerResult:
        """
        Main entry point to crawl a repository.
        """
        parsed = parse_github_url(repo_url)
        if not parsed:
            raise ValueError(f"Invalid GitHub URL: {repo_url}")
        
        owner, repo = parsed
        
        # Determine actual branch
        if branch == "main" or branch is None:
            branch = await self.get_default_branch(owner, repo)
            
        tree = await self.get_repo_tree(owner, repo, branch)
        
        # Filter for documentation files
        doc_files = [
            RepoDoc(path=item["path"], url=f"https://github.com/{owner}/{repo}/blob/{branch}/{item['path']}")
            for item in tree if item["type"] == "blob" and is_doc_file(item["path"])
        ]

        # Fetch contents in parallel with controlled concurrency
        semaphore = asyncio.Semaphore(10) # 10 parallel requests at a time
        tasks = [
            self.fetch_file_content(owner, repo, doc.path, branch, semaphore)
            for doc in doc_files
        ]
        contents = await asyncio.gather(*tasks)

        for doc, content in zip(doc_files, contents):
            doc.content = content

        # Filter out files that were found but appeared empty or failed to download
        valid_docs = [d for d in doc_files if d.content and len(d.content) > 10]

        return CrawlerResult(
            repo_url=repo_url,
            files_found=len(valid_docs),
            files=valid_docs
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
