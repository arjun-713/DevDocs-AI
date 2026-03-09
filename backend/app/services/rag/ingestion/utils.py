import re
from typing import Tuple, Optional

def parse_github_url(url: str) -> Optional[Tuple[str, str]]:
    """
    Parses a GitHub URL or a raw 'owner/repo' string into owner and repo name.
    Example: https://github.com/fastapi/fastapi -> ('fastapi', 'fastapi')
    Example: fastapi/fastapi -> ('fastapi', 'fastapi')
    """
    # First check for full URL format
    pattern = r"github\.com/([^/]+)/([^/]+)"
    match = re.search(pattern, url)
    if match:
        owner = match.group(1)
        repo = match.group(2).replace(".git", "")
        return owner, repo
        
    # Check for simple owner/repo format
    simple_pattern = r"^([a-zA-Z0-9_.-]+)/([a-zA-Z0-9_.-]+)$"
    simple_match = re.match(simple_pattern, url.strip())
    if simple_match:
        return simple_match.group(1), simple_match.group(2).replace(".git", "")
        
    return None

def is_doc_file(filepath: str) -> bool:
    """
    Checks if a file is a useful documentation file based on:
    1. File extension (.md, .mdx, .rst, .txt)
    2. Directory path (rejects noise directories)
    3. Filename (rejects boilerplate files like LICENSE, CONTRIBUTING)
    """
    doc_extensions = {".md", ".mdx", ".rst", ".txt"}
    
    # ── Directory blacklist ──
    # Any file whose path contains one of these directory segments is skipped.
    # This prevents indexing auto-generated, config, or framework scaffolding files.
    blacklisted_dirs = {
        # AI agent / skill scaffolding
        ".skills", "skills", ".agents", ".agent", "_agents", "_agent",
        # CI / GitHub config
        ".github", ".gitlab", ".circleci", ".husky",
        # Package manager / dependency dirs
        "node_modules", ".venv", "venv", "env", "__pycache__",
        "vendor", "bower_components", ".tox",
        # Build output
        "dist", "build", "_build", ".next", ".nuxt", "out",
        # IDE / editor config
        ".vscode", ".idea", ".devcontainer",
        # Docker / infra
        ".docker",
        # Test fixtures & snapshots (often huge, not useful docs)
        "__snapshots__", "__fixtures__", "__mocks__",
        # Gemini / other agent folders
        ".gemini",
    }

    # ── Filename blacklist ──
    # Common boilerplate files that aren't useful for answering "what does this project do?"
    blacklisted_filenames = {
        "license", "licence", "contributing", "code_of_conduct", "security",
        "pull_request_template", "issue_template", "changelog", "changes",
        "authors", "codeowners", "funding",
    }

    lower_path = filepath.lower()

    # 1. Check extension
    if not any(lower_path.endswith(ext) for ext in doc_extensions):
        return False

    # 2. Check if any path segment is a blacklisted directory
    path_parts = lower_path.replace("\\", "/").split("/")
    for part in path_parts[:-1]:  # exclude the filename itself
        if part in blacklisted_dirs:
            return False

    # 3. Check filename blacklist
    base_name = path_parts[-1].split(".")[0]
    if base_name in blacklisted_filenames:
        return False

    return True

