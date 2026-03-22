# ResearchClaw

Multi-role research loop agent system, built on [openclaw](https://github.com/nicepkg/openclaw).

Three agents (Researcher → Executor → Writer) + 11 shared skills, driving a complete research loop:

```
Idea → Plan → Execute → Evaluate → Write → Iterate
```

## Quick Start

### Prerequisites

- Python >= 3.10
- [openclaw](https://github.com/nicepkg/openclaw) installed and in PATH

### Install

```bash
cd ResearchClaw
pip install -e .
```

### Usage

```bash
# 1. Create a project
rclaw init my-research

# 2. Start research loop
cd my-research
rclaw run "探索 LLM agent 的 self-reflection 机制对任务完成率的影响"

# 3. Check progress
rclaw status
```

## Commands

### `rclaw init <project-name>`

Create a new research workspace:

```
my-research/
  spec/               # Research spec (living document)
  literature/         # Papers, bib, citation cards
  plans/              # Versioned research plans
  experiments/        # Code, logs, results
  reports/            # Execution reports, evaluations
  writing/            # Paper outlines and drafts
  memory/             # Project memory across iterations
  .researchclaw/      # Internal config and agent state
```

Options:
- `-d, --dir <path>` — target directory (default: `./<project-name>`)

### `rclaw run [idea]`

Start or resume the research loop.

- With `idea`: Single-shot mode — Researcher receives it and runs a full loop
- Without `idea`: Interactive REPL — maintain a session with the Researcher across messages

```bash
# Single-shot
rclaw run "探索 LLM self-reflection 对任务完成率的影响"

# Interactive
rclaw run
rclaw> 我想研究 agent 的 self-reflection 机制
rclaw> 继续上次的实验方向，增加 ablation
rclaw> quit
```

Options:
- `-p, --project <path>` — project directory (default: cwd)
- `--agent <id>` — target agent: `researcher` (default), `executor`, `writer`

### `rclaw status`

Show project state and list all artifacts.

Options:
- `-p, --project <path>` — project directory (default: cwd)

## Architecture

### Agents

| Agent | Role | Can Spawn |
|-------|------|-----------|
| **Researcher** | Core decision maker — plans, evaluates, decides direction | Executor, Writer |
| **Executor** | Implementation specialist — decomposes, runs experiments, reports results | — |
| **Writer** | Academic writer — outlines, drafts, cites, revises | — |

### Research Loop

```
        ┌──────────────┐
        │  Researcher   │ ← User idea / previous results
        │  Plan + Eval  │
        └──────┬───────┘
               │ spawn executor
               ▼
        ┌──────────────┐
        │   Executor    │
        │  Run + Report │
        └──────┬───────┘
               │ results
               ▼
        ┌──────────────┐
        │  Researcher   │ → Evaluate → Continue / Pivot / Write
        └──────┬───────┘
               │ spawn writer (when ready)
               ▼
        ┌──────────────┐
        │    Writer     │
        │ Outline+Draft │
        └──────────────┘
```

### Shared Skills (11)

**Research**: `literature-search` · `paper-reader` · `spec-writer` · `experiment-planner`

**Execution**: `task-decomposer` · `code-runner` · `result-parser`

**Writing**: `outline-writer` · `section-writer` · `citation-builder` · `bib-exporter`

**Infrastructure**: `workspace-manager` · `artifact-manager`

All skills are agent-agnostic markdown files — any agent can call any skill.

## How It Works With openclaw

ResearchClaw wraps openclaw by:

1. **`rclaw init`** creates a workspace and copies agent identity/protocol files (IDENTITY.md, AGENTS.md, SOUL.md) into per-agent directories
2. **`rclaw run`** generates a merged openclaw config with:
   - 3 agents, each with their own `workspace` pointing to their identity dir
   - SOUL.md in each agent dir provides the shared project root path
   - `skills.load.extraDirs` pointing to ResearchClaw's 13 skill definitions
3. Sets `OPENCLAW_CONFIG_PATH` and launches `openclaw agent --message "..." --local`
4. Researcher uses `sessions_spawn` tool to delegate work to Executor/Writer

## Workspace Conventions

- **Versioned files**: `plans/plan-v1.md`, `reports/evaluation-v2.md`, `writing/draft-v1/`
- **Never overwrite**: always create new versions
- **Memory**: `memory/MEMORY.md` is updated after each iteration with decisions and rationale
- **State**: `.researchclaw/state.json` tracks current stage and iteration count

## Configuration

Project config is at `.researchclaw/config.json`:

```json
{
  "projectName": "my-research",
  "model": {"primary": "claude-sonnet-4-20250514"}
}
```

Change `model.primary` to use a different model for all agents.

## Development

```bash
# Run without installing
python -m rclaw.cli init my-project
python -m rclaw.cli run "idea" --project my-project
python -m rclaw.cli status --project my-project
```

## License

MIT
