"""Agent class — tool-calling loop over OpenAI chat completions."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .llm import chat
from .tools import TOOL_REGISTRY, TOOL_SCHEMAS
from .workspace import PACKAGE_ROOT, RC_DIR, read_state

# Skills each role loads into its system prompt
AGENT_SKILLS: dict[str, list[str]] = {
    "researcher": [
        "literature-search", "paper-reader", "spec-writer",
        "experiment-planner", "workspace-manager", "artifact-manager",
    ],
    "executor": [
        "task-decomposer", "code-runner", "result-parser",
        "experiment-planner", "workspace-manager", "artifact-manager",
    ],
    "writer": [
        "outline-writer", "section-writer", "literature-search",
        "paper-reader", "citation-builder", "bib-exporter",
        "workspace-manager", "artifact-manager",
    ],
}

DEFAULT_MODEL = "gpt-5-chat"


class Agent:
    """A single research agent that runs a tool-calling loop."""

    def __init__(
        self,
        role: str,
        project_dir: Path,
        model: str = DEFAULT_MODEL,
    ):
        self.role = role
        self.project_dir = project_dir.resolve()
        self.model = model
        self.messages: list[dict[str, Any]] = [
            {"role": "system", "content": self._build_system_prompt()},
        ]

    def run(self, task: str, max_iterations: int = 30) -> str:
        """Execute a task with tool-calling loop. Returns final text response."""
        self.messages.append({"role": "user", "content": task})

        for i in range(max_iterations):
            resp = chat(
                self.messages,
                tools=TOOL_SCHEMAS,
                model=self.model,
                temperature=0.7,
                max_tokens=16384,
            )
            choice = resp.choices[0]
            msg = choice.message

            # Append assistant message to history
            self.messages.append(_message_to_dict(msg))

            # If no tool calls, we're done
            if choice.finish_reason != "tool_calls" or not msg.tool_calls:
                return msg.content or ""

            # Execute each tool call and append results
            for tc in msg.tool_calls:
                result = self._execute_tool(tc.function.name, tc.function.arguments)
                self.messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": result,
                })
                print(f"  [{self.role}] tool: {tc.function.name} → {_truncate(result, 120)}")

        return f"[Warning: reached {max_iterations} iterations without final response]"

    def inject_context(self, content: str) -> None:
        """Inject context into conversation history without triggering a response."""
        self.messages.append({"role": "user", "content": content})
        self.messages.append({
            "role": "assistant",
            "content": "Understood. I've noted this context.",
        })

    # ── Private ───────────────────────────────────────────────────

    def _build_system_prompt(self) -> str:
        """Construct system prompt from identity, protocol, skills, and workspace context."""
        parts: list[str] = []

        agents_dir = PACKAGE_ROOT / "agents" / self.role

        # 1. Identity
        identity_path = agents_dir / "IDENTITY.md"
        if identity_path.exists():
            parts.append(identity_path.read_text())

        # 2. Protocol
        protocol_path = agents_dir / "AGENTS.md"
        if protocol_path.exists():
            parts.append(protocol_path.read_text())

        # 3. Skills
        skill_names = AGENT_SKILLS.get(self.role, [])
        skills_dir = PACKAGE_ROOT / "skills"
        for skill_name in skill_names:
            skill_path = skills_dir / skill_name / "SKILL.md"
            if skill_path.exists():
                parts.append(f"## Skill: {skill_name}\n\n{skill_path.read_text()}")

        # 4. Workspace context
        state = read_state(self.project_dir)
        parts.append(self._workspace_context(state))

        # 5. System overrides (no sessions_spawn, tool list)
        tool_names = ", ".join(TOOL_REGISTRY.keys())
        parts.append(
            "## System Notes\n\n"
            "You are running inside ResearchClaw's self-contained Python runtime.\n"
            "- There is NO `sessions_spawn` tool. The orchestrator handles agent delegation.\n"
            "- You communicate with other agents through workspace files.\n"
            f"- Available tools: {tool_names}\n"
            "- Always use absolute paths when reading/writing files.\n"
            "- Write all artifacts to the project workspace directories.\n"
        )

        return "\n\n---\n\n".join(parts)

    def _workspace_context(self, state: dict) -> str:
        """Generate workspace context block."""
        dirs = "\n".join(f"  - {self.project_dir}/{d}/" for d in (
            "spec", "literature", "plans", "experiments", "reports", "writing", "memory",
        ))
        return (
            f"## Workspace Context\n\n"
            f"Project root: {self.project_dir}\n"
            f"Project name: {state.get('projectName', 'unknown')}\n"
            f"Current stage: {state.get('currentStage', 'unknown')}\n"
            f"Iteration: {state.get('iteration', 0)}\n\n"
            f"Workspace directories:\n{dirs}\n"
        )

    def _execute_tool(self, name: str, arguments: str) -> str:
        """Execute a tool by name with JSON arguments."""
        fn = TOOL_REGISTRY.get(name)
        if not fn:
            return f"Error: unknown tool '{name}'"
        try:
            kwargs = json.loads(arguments)
        except json.JSONDecodeError:
            return f"Error: invalid JSON arguments: {arguments}"
        try:
            return fn(**kwargs)
        except TypeError as e:
            return f"Error: bad arguments for {name}: {e}"
        except Exception as e:
            return f"Error executing {name}: {e}"


# ── Helpers ───────────────────────────────────────────────────────


def _message_to_dict(msg: Any) -> dict:
    """Convert an OpenAI message object to a serializable dict."""
    d: dict[str, Any] = {"role": msg.role}
    if msg.content:
        d["content"] = msg.content
    if msg.tool_calls:
        d["tool_calls"] = [
            {
                "id": tc.id,
                "type": "function",
                "function": {
                    "name": tc.function.name,
                    "arguments": tc.function.arguments,
                },
            }
            for tc in msg.tool_calls
        ]
    return d


def _truncate(s: str, maxlen: int) -> str:
    """Truncate a string for display."""
    s = s.replace("\n", " ").strip()
    return s[:maxlen] + "..." if len(s) > maxlen else s
