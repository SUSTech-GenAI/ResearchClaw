"""ResearchClaw CLI — rclaw init | run | status."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .workspace import RC_DIR, init_workspace, print_status


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        prog="rclaw",
        description="ResearchClaw — multi-role research loop agent system",
    )
    parser.add_argument("--version", action="version", version="researchclaw 0.2.0")
    sub = parser.add_subparsers(dest="command")

    # ── init ──────────────────────────────────────────────────────
    p_init = sub.add_parser("init", help="Initialize a new research project")
    p_init.add_argument("project_name", help="Project name")
    p_init.add_argument("-d", "--dir", help="Target directory (default: ./<name>)")

    # ── run ───────────────────────────────────────────────────────
    p_run = sub.add_parser("run", help="Start or resume the research loop")
    p_run.add_argument("idea", nargs="?", help="Research idea (omit for interactive mode)")
    p_run.add_argument("-p", "--project", help="Project directory (default: cwd)")
    p_run.add_argument(
        "-m", "--model", default="gpt-5-chat",
        help="Model to use (default: gpt-5-chat)",
    )

    # ── status ────────────────────────────────────────────────────
    p_status = sub.add_parser("status", help="Show project status and artifacts")
    p_status.add_argument("-p", "--project", help="Project directory (default: cwd)")

    args = parser.parse_args(argv)

    if args.command == "init":
        cmd_init(args)
    elif args.command == "run":
        cmd_run(args)
    elif args.command == "status":
        cmd_status(args)
    else:
        parser.print_help()
        sys.exit(1)


# ── Commands ──────────────────────────────────────────────────────


def cmd_init(args: argparse.Namespace) -> None:
    try:
        project_dir = init_workspace(args.project_name, args.dir)
    except FileExistsError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    print(f'Research project "{args.project_name}" initialized at {project_dir}\n')
    print("Workspace:")
    for d in ("spec", "literature", "plans", "experiments", "reports", "writing", "memory"):
        print(f"  {d}/")
    print(f"\nNext:  cd {project_dir}")
    print(f'       rclaw run "your research idea here"')


def cmd_run(args: argparse.Namespace) -> None:
    project_dir = Path(args.project or ".").resolve()
    if not (project_dir / RC_DIR).exists():
        _die('Not a ResearchClaw project. Run "rclaw init <name>" first.')

    model = args.model

    if args.idea:
        # Single-shot: run full research loop
        from .orchestrator import Orchestrator

        orchestrator = Orchestrator(project_dir, model=model)
        orchestrator.run(args.idea)
    else:
        # Interactive REPL: maintain a session with the Researcher
        from .agent import Agent

        researcher = Agent("researcher", project_dir, model=model)
        print(f"ResearchClaw interactive session (model: {model})")
        print('Type your messages. "quit" to exit.\n')

        while True:
            try:
                msg = input("rclaw> ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\nSession ended.")
                break

            if not msg:
                continue
            if msg.lower() in ("quit", "exit", "q"):
                print("Session ended.")
                break

            response = researcher.run(msg)
            print(f"\n{response}\n")


def cmd_status(args: argparse.Namespace) -> None:
    project_dir = Path(args.project or ".").resolve()
    if not (project_dir / RC_DIR).exists():
        _die('Not a ResearchClaw project. Run "rclaw init <name>" first.')
    print_status(project_dir)


# ── Helpers ───────────────────────────────────────────────────────


def _die(msg: str) -> None:
    print(f"Error: {msg}", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
