"""Executable tools for ResearchClaw agents + OpenAI function-calling schemas."""

from __future__ import annotations

import json
import os
import shutil
import signal
import subprocess
import threading
import urllib.request
import urllib.parse
import uuid
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

# ── Tool implementations ─────────────────────────────────────────


def read_file(path: str) -> str:
    """Read a file from the workspace. Max 100 KB."""
    p = Path(path)
    if not p.exists():
        return f"Error: file not found: {path}"
    if p.stat().st_size > 100_000:
        return f"Error: file too large (>{100_000} bytes): {path}"
    try:
        return p.read_text(errors="replace")
    except Exception as e:
        return f"Error reading file: {e}"


def write_file(path: str, content: str) -> str:
    """Write content to a file, creating parent directories as needed."""
    p = Path(path)
    try:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content)
        return f"Wrote {len(content)} bytes to {path}"
    except Exception as e:
        return f"Error writing file: {e}"


def list_files(directory: str) -> str:
    """List entries in a directory."""
    p = Path(directory)
    if not p.exists():
        return f"Error: directory not found: {directory}"
    if not p.is_dir():
        return f"Error: not a directory: {directory}"
    entries = sorted(p.iterdir())
    lines = []
    for e in entries:
        if e.name.startswith("."):
            continue
        kind = "dir" if e.is_dir() else "file"
        lines.append(f"  [{kind}] {e.name}")
    return "\n".join(lines) if lines else "(empty directory)"


def run_code(code: str, language: str = "python") -> str:
    """Execute code in a subprocess. Supports python and bash. 120s timeout."""
    if language not in ("python", "bash"):
        return f"Error: unsupported language '{language}'. Use 'python' or 'bash'."
    cmd = ["python3", "-c", code] if language == "python" else ["bash", "-c", code]
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=120,
        )
        out = ""
        if result.stdout:
            out += result.stdout
        if result.stderr:
            out += f"\n[stderr]\n{result.stderr}"
        if result.returncode != 0:
            out += f"\n[exit code: {result.returncode}]"
        # Truncate long output
        if len(out) > 10_000:
            out = out[:10_000] + "\n... (truncated)"
        return out.strip() or "(no output)"
    except subprocess.TimeoutExpired:
        return "Error: execution timed out (120s limit)"
    except Exception as e:
        return f"Error running code: {e}"


def search_papers(query: str, limit: int = 10) -> str:
    """Search papers via Semantic Scholar API."""
    params = urllib.parse.urlencode({
        "query": query,
        "limit": min(limit, 20),
        "fields": "title,authors,year,abstract,url,citationCount",
    })
    url = f"https://api.semanticscholar.org/graph/v1/paper/search?{params}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "ResearchClaw/0.2"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
        papers = data.get("data", [])
        if not papers:
            return f"No papers found for query: {query}"
        results = []
        for p in papers:
            authors = ", ".join(
                a.get("name", "?") for a in (p.get("authors") or [])[:3]
            )
            if len(p.get("authors") or []) > 3:
                authors += " et al."
            results.append(
                f"- **{p.get('title', 'Untitled')}** ({p.get('year', '?')})\n"
                f"  Authors: {authors}\n"
                f"  Citations: {p.get('citationCount', '?')} | {p.get('url', '')}\n"
                f"  Abstract: {(p.get('abstract') or 'N/A')[:300]}"
            )
        return f"Found {len(papers)} papers:\n\n" + "\n\n".join(results)
    except Exception as e:
        return f"Error searching papers: {e}"


def fetch_arxiv(query: str, max_results: int = 5) -> str:
    """Search arXiv for papers matching a query."""
    params = urllib.parse.urlencode({
        "search_query": f"all:{query}",
        "start": 0,
        "max_results": min(max_results, 10),
        "sortBy": "relevance",
        "sortOrder": "descending",
    })
    url = f"http://export.arxiv.org/api/query?{params}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "ResearchClaw/0.2"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            xml_data = resp.read().decode()
        root = ET.fromstring(xml_data)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        entries = root.findall("atom:entry", ns)
        if not entries:
            return f"No arXiv papers found for query: {query}"
        results = []
        for entry in entries:
            title = (entry.findtext("atom:title", "", ns) or "").strip().replace("\n", " ")
            summary = (entry.findtext("atom:summary", "", ns) or "").strip()[:300]
            authors = [
                a.findtext("atom:name", "?", ns)
                for a in entry.findall("atom:author", ns)[:3]
            ]
            if len(entry.findall("atom:author", ns)) > 3:
                authors.append("et al.")
            published = (entry.findtext("atom:published", "", ns) or "")[:10]
            link = ""
            for lk in entry.findall("atom:link", ns):
                if lk.get("type") == "text/html":
                    link = lk.get("href", "")
                    break
            if not link:
                link = entry.findtext("atom:id", "", ns) or ""
            results.append(
                f"- **{title}** ({published})\n"
                f"  Authors: {', '.join(authors)}\n"
                f"  Link: {link}\n"
                f"  Abstract: {summary}"
            )
        return f"Found {len(entries)} arXiv papers:\n\n" + "\n\n".join(results)
    except Exception as e:
        return f"Error fetching arXiv: {e}"


def web_search(query: str) -> str:
    """Web search placeholder — not yet configured."""
    return (
        f"Web search is not configured. Query was: {query}\n"
        "Use search_papers or fetch_arxiv for academic paper search."
    )


# ── Process management ───────────────────────────────────────────

_PROCESSES: dict[str, dict] = {}  # id → {popen, stdout_lines, stderr_lines, read_pos}


def _find_uv() -> str | None:
    """Find the uv binary."""
    # Check common locations
    for candidate in (
        shutil.which("uv"),
        os.path.expanduser("~/.local/bin/uv"),
        os.path.expanduser("~/.cargo/bin/uv"),
    ):
        if candidate and Path(candidate).exists():
            return candidate
    return None


def setup_env(experiment_dir: str, packages: list[str]) -> str:
    """Create a Python virtual environment with uv and install packages."""
    exp_path = Path(experiment_dir)
    exp_path.mkdir(parents=True, exist_ok=True)
    venv_path = exp_path / ".venv"

    uv = _find_uv()
    if not uv:
        return "Error: uv not found. Install it: curl -LsSf https://astral.sh/uv/install.sh | sh"

    # Create venv
    try:
        result = subprocess.run(
            [uv, "venv", str(venv_path)],
            capture_output=True, text=True, timeout=60,
        )
        if result.returncode != 0:
            return f"Error creating venv: {result.stderr}"
    except subprocess.TimeoutExpired:
        return "Error: venv creation timed out"

    if not packages:
        return f"Environment created at {venv_path} (no packages to install)"

    # Install packages
    python_bin = venv_path / "bin" / "python"
    try:
        result = subprocess.run(
            [uv, "pip", "install", "--python", str(python_bin)] + packages,
            capture_output=True, text=True, timeout=600,
        )
        out = ""
        if result.stdout:
            out += result.stdout
        if result.stderr:
            out += f"\n{result.stderr}"
        if result.returncode != 0:
            return f"Error installing packages:\n{out}"
        # Summarize
        installed = [p for p in packages]
        return f"Environment ready at {venv_path}\nInstalled: {', '.join(installed)}\n{out.strip()}"
    except subprocess.TimeoutExpired:
        return "Error: package installation timed out (300s limit)"


def _reader_thread(pipe, lines: list) -> None:
    """Background thread that reads pipe lines into a buffer."""
    try:
        for line in iter(pipe.readline, ""):
            lines.append(line)
    except ValueError:
        pass  # pipe closed
    finally:
        try:
            pipe.close()
        except Exception:
            pass


def process_start(command: str, workdir: str, use_venv: bool = True) -> str:
    """Start a background process. Returns a process ID for polling."""
    work = Path(workdir)
    if not work.exists():
        return f"Error: workdir not found: {workdir}"

    # Build shell command, activating venv if available
    venv_path = work / ".venv"
    if use_venv and venv_path.exists():
        shell_cmd = f"source {venv_path}/bin/activate && {command}"
    else:
        shell_cmd = command

    try:
        env = {**os.environ, "PYTHONUNBUFFERED": "1"}
        proc = subprocess.Popen(
            ["bash", "-c", shell_cmd],
            cwd=str(work),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env,
        )
    except Exception as e:
        return f"Error starting process: {e}"

    proc_id = f"proc-{uuid.uuid4().hex[:8]}"
    stdout_lines: list[str] = []
    stderr_lines: list[str] = []

    # Start reader threads to avoid pipe buffer deadlock
    t_out = threading.Thread(target=_reader_thread, args=(proc.stdout, stdout_lines), daemon=True)
    t_err = threading.Thread(target=_reader_thread, args=(proc.stderr, stderr_lines), daemon=True)
    t_out.start()
    t_err.start()

    _PROCESSES[proc_id] = {
        "popen": proc,
        "stdout_lines": stdout_lines,
        "stderr_lines": stderr_lines,
        "stdout_pos": 0,
        "stderr_pos": 0,
        "command": command,
        "workdir": workdir,
    }

    return f"Process started: {proc_id}\nCommand: {command}\nWorkdir: {workdir}\nPID: {proc.pid}"


def process_poll(process_id: str) -> str:
    """Poll a background process for status and new output."""
    entry = _PROCESSES.get(process_id)
    if not entry:
        return f"Error: unknown process '{process_id}'"

    proc = entry["popen"]
    returncode = proc.poll()

    # Get new output since last poll
    stdout_lines = entry["stdout_lines"]
    stderr_lines = entry["stderr_lines"]
    out_pos = entry["stdout_pos"]
    err_pos = entry["stderr_pos"]

    new_stdout = "".join(stdout_lines[out_pos:])
    new_stderr = "".join(stderr_lines[err_pos:])
    entry["stdout_pos"] = len(stdout_lines)
    entry["stderr_pos"] = len(stderr_lines)

    # Truncate if too long
    if len(new_stdout) > 10_000:
        new_stdout = new_stdout[:10_000] + "\n... (truncated)"
    if len(new_stderr) > 5_000:
        new_stderr = new_stderr[:5_000] + "\n... (truncated)"

    if returncode is None:
        status = "running"
    elif returncode == 0:
        status = f"completed (exit 0)"
    else:
        status = f"failed (exit {returncode})"

    parts = [f"Status: {status}"]
    if new_stdout.strip():
        parts.append(f"--- stdout ---\n{new_stdout.rstrip()}")
    if new_stderr.strip():
        parts.append(f"--- stderr ---\n{new_stderr.rstrip()}")
    if not new_stdout.strip() and not new_stderr.strip():
        parts.append("(no new output)")

    return "\n".join(parts)


def process_kill(process_id: str) -> str:
    """Kill a background process."""
    entry = _PROCESSES.get(process_id)
    if not entry:
        return f"Error: unknown process '{process_id}'"

    proc = entry["popen"]
    if proc.poll() is not None:
        return f"Process {process_id} already exited (code {proc.returncode})"

    # SIGTERM first, then SIGKILL after 5s
    try:
        os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
    except (ProcessLookupError, OSError):
        proc.terminate()

    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait(timeout=2)

    return f"Process {process_id} killed (PID {proc.pid})"


# ── Registry ─────────────────────────────────────────────────────

TOOL_REGISTRY: dict[str, Any] = {
    "read_file": read_file,
    "write_file": write_file,
    "list_files": list_files,
    "run_code": run_code,
    "search_papers": search_papers,
    "fetch_arxiv": fetch_arxiv,
    "web_search": web_search,
    "setup_env": setup_env,
    "process_start": process_start,
    "process_poll": process_poll,
    "process_kill": process_kill,
}

TOOL_SCHEMAS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read a file from the workspace. Max 100 KB.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Absolute path to the file"},
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Write content to a file, creating parent directories as needed.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Absolute path to the file"},
                    "content": {"type": "string", "description": "Content to write"},
                },
                "required": ["path", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_files",
            "description": "List files and directories in a given directory.",
            "parameters": {
                "type": "object",
                "properties": {
                    "directory": {"type": "string", "description": "Absolute path to the directory"},
                },
                "required": ["directory"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_code",
            "description": "Execute Python or bash code in a subprocess with 120s timeout.",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {"type": "string", "description": "Code to execute"},
                    "language": {
                        "type": "string",
                        "enum": ["python", "bash"],
                        "description": "Language: python or bash (default: python)",
                    },
                },
                "required": ["code"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_papers",
            "description": "Search academic papers via Semantic Scholar API.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "limit": {"type": "integer", "description": "Max results (default 10, max 20)"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "fetch_arxiv",
            "description": "Search arXiv for papers matching a query.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "max_results": {"type": "integer", "description": "Max results (default 5, max 10)"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for information (currently returns placeholder).",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "setup_env",
            "description": "Create a Python virtual environment using uv and install packages. Each experiment directory gets its own isolated .venv.",
            "parameters": {
                "type": "object",
                "properties": {
                    "experiment_dir": {"type": "string", "description": "Absolute path to the experiment directory"},
                    "packages": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of pip packages to install (e.g. ['torch', 'numpy'])",
                    },
                },
                "required": ["experiment_dir", "packages"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "process_start",
            "description": "Start a background process. Returns a process ID. Use process_poll to check status and get output. Automatically activates .venv if present in workdir.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "Shell command to execute"},
                    "workdir": {"type": "string", "description": "Working directory (absolute path)"},
                    "use_venv": {
                        "type": "boolean",
                        "description": "Activate .venv in workdir if present (default: true)",
                    },
                },
                "required": ["command", "workdir"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "process_poll",
            "description": "Poll a background process for status and new output since last poll. Returns status (running/completed/failed) and incremental stdout/stderr.",
            "parameters": {
                "type": "object",
                "properties": {
                    "process_id": {"type": "string", "description": "Process ID returned by process_start"},
                },
                "required": ["process_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "process_kill",
            "description": "Kill a running background process.",
            "parameters": {
                "type": "object",
                "properties": {
                    "process_id": {"type": "string", "description": "Process ID to kill"},
                },
                "required": ["process_id"],
            },
        },
    },
]
