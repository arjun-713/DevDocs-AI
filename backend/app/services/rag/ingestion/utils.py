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
    Checks if a file is a documentation file based on its extension
    and filters out common noise files.
    """
    doc_extensions = {".md", ".mdx", ".rst", ".txt"}
    
    # Files often found in docs folders but not useful for RAG context
    blacklist_patterns = {
        "license", "contributing", "code_of_conduct", "security", 
        "pull_request_template", "issue_template", "changelog"
    }
    
    lower_filename = filename.lower()
    
    if not any(lower_filename.endswith(ext) for ext in doc_extensions):
        return False
        
    # Check if the filename (without extension) is in the blacklist
    base_name = lower_filename.split("/")[-1].split(".")[0]
    if base_name in blacklist_patterns:
        return False
        
    return True
