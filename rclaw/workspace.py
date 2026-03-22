"""Workspace initialization and state management."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

RC_DIR = ".researchclaw"
WORKSPACE_DIRS = ("spec", "literature", "plans", "experiments", "reports", "writing", "memory")
PACKAGE_ROOT = Path(__file__).resolve().parent.parent  # ResearchClaw/


def init_workspace(project_name: str, target_dir: str | None = None) -> Path:
    """Create a new research project workspace."""
    project_dir = Path(target_dir or project_name).resolve()
    rc_dir = project_dir / RC_DIR

    if rc_dir.exists():
        raise FileExistsError(
            f"Project already initialized at {project_dir}. "
            f"Remove {RC_DIR}/ to reinitialize."
        )

    # Create workspace directories
    for d in WORKSPACE_DIRS:
        (project_dir / d).mkdir(parents=True, exist_ok=True)

    # Create internal directory
    rc_dir.mkdir(parents=True, exist_ok=True)

    # Write project config
    _write_json(rc_dir / "config.json", {
        "projectName": project_name,
        "projectDir": str(project_dir),
        "model": {"primary": "gpt-5-chat"},
    })

    # Write initial state
    now = datetime.now(timezone.utc).isoformat()
    _write_json(rc_dir / "state.json", {
        "projectName": project_name,
        "currentStage": "init",
        "iteration": 0,
        "createdAt": now,
        "updatedAt": now,
    })

    # Copy templates
    _copy_templates(project_dir, project_name)

    return project_dir


def read_state(project_dir: Path) -> dict[str, Any]:
    """Read workspace state, returning defaults if missing."""
    state_path = project_dir / RC_DIR / "state.json"
    try:
        return json.loads(state_path.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {
            "projectName": project_dir.name,
            "currentStage": "unknown",
            "iteration": 0,
            "createdAt": "",
            "updatedAt": "",
        }


def update_state(project_dir: Path, **updates: Any) -> None:
    """Merge updates into workspace state."""
    state = read_state(project_dir)
    state.update(updates, updatedAt=datetime.now(timezone.utc).isoformat())
    _write_json(project_dir / RC_DIR / "state.json", state)


def print_status(project_dir: Path) -> None:
    """Print formatted project status."""
    state = read_state(project_dir)

    print("=== ResearchClaw Project Status ===\n")
    print(f"  Project:    {state['projectName']}")
    print(f"  Stage:      {state['currentStage']}")
    print(f"  Iteration:  {state['iteration']}")
    print(f"  Updated:    {state.get('updatedAt') or '—'}\n")

    # List artifacts per directory
    for d in WORKSPACE_DIRS:
        dir_path = project_dir / d
        if not dir_path.exists():
            continue
        entries = sorted(
            p for p in dir_path.iterdir()
            if not p.name.startswith(".") and p.name != ".gitkeep"
        )
        if not entries:
            continue
        print(f"  {d}/")
        for entry in entries:
            icon = "📁" if entry.is_dir() else "  "
            print(f"    {icon} {entry.name}")
    print()

    # Show memory summary (only real iteration entries, not template comments)
    mem_path = project_dir / "memory" / "MEMORY.md"
    if mem_path.exists():
        lines = [
            l for l in mem_path.read_text().splitlines()
            if l.startswith("## Iteration ")  # Only actual iteration headers
        ]
        if lines:
            print("  Memory (recent iterations):")
            for line in lines[-5:]:
                print(f"    {line}")
            print()


# ── internal helpers ──────────────────────────────────────────────


def _write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def _copy_templates(project_dir: Path, project_name: str) -> None:
    templates = PACKAGE_ROOT / "templates"

    # Research spec
    spec_tmpl = templates / "spec" / "research-spec.template.md"
    if spec_tmpl.exists():
        text = spec_tmpl.read_text().replace("{{PROJECT_NAME}}", project_name)
        (project_dir / "spec" / "research-spec.md").write_text(text)

    # Plan template (copy as reference)
    plan_tmpl = templates / "plans" / "plan.template.md"
    if plan_tmpl.exists():
        import shutil
        shutil.copy2(plan_tmpl, project_dir / "plans" / "plan.template.md")

    # Memory
    mem_tmpl = templates / "memory" / "MEMORY.md"
    mem_dest = project_dir / "memory" / "MEMORY.md"
    if mem_tmpl.exists():
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        text = mem_tmpl.read_text().replace("_auto-filled on init_", now)
        mem_dest.write_text(text)
    else:
        mem_dest.write_text(f"# {project_name} — Project Memory\n")
