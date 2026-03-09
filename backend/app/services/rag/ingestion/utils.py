import re
from typing import Tuple, Optional

def parse_github_url(url: str) -> Optional[Tuple[str, str]]:
    """
    Parses a GitHub URL into owner and repo name.
    Example: https://github.com/fastapi/fastapi -> ('fastapi', 'fastapi')
    """
    pattern = r"github\.com/([^/]+)/([^/]+)"
    match = re.search(pattern, url)
    if match:
        owner = match.group(1)
        repo = match.group(2).replace(".git", "")
        return owner, repo
    return None

def is_doc_file(filename: str) -> bool:
    """
    Checks if a file is a documentation file based on its extension.
    """
    doc_extensions = {".md", ".mdx", ".rst", ".txt"}
    return any(filename.lower().endswith(ext) for ext in doc_extensions)
