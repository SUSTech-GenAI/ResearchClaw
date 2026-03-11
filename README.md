# ResearchClaw

**ResearchClaw** is an agentic academic research system built on [OpenClaw](https://github.com/openclaw/openclaw). Given a rough research goal, it autonomously conducts a literature survey, plans and runs experiments, and writes a complete LaTeX paper — all with a single command.

## Pipeline Overview

```
User Goal
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Stage 1: Survey Agent                                          │
│  • Searches arXiv, Semantic Scholar, and the web               │
│  • Collects 20-30 relevant papers                              │
│  • Generates 3-5 research ideas                                │
│  • Selects the best idea with acceptance criteria              │
│  • Organizes references by paper section                       │
│  → Output: survey-report.md + research-state.json             │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Stage 2: Planner Agent (initial)                               │
│  • Reads survey report and selected idea                       │
│  • Creates experiment todo list (3-6 initial tasks)            │
│  • Defines loose acceptance criteria per task                  │
│  → Output: todo-list.md                                        │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Stage 3: Planner ↔ Executor Loop                              │
│                                                                 │
│  ┌─────────────┐    task     ┌──────────────────────────────┐  │
│  │   Planner   │ ──────────▶ │        Executor              │  │
│  │             │             │  • Writes Python code        │  │
│  │  • Reads    │ ◀────────── │  • Runs experiments          │  │
│  │    results  │   result    │  • Measures metrics          │  │
│  │  • Updates  │             │  • Saves result files        │  │
│  │    todo     │             └──────────────────────────────┘  │
│  └─────────────┘                                               │
│       │ (all criteria met)                                      │
│       ▼                                                         │
│  → Output: experiment-results/*.md                             │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Stage 4: Paper Writer Agent                                    │
│  • Synthesizes survey + experiment results                     │
│  • Writes complete LaTeX paper (NeurIPS/ICML/ICLR style)      │
│  • Generates BibTeX references                                 │
│  • Compiles to PDF (requires TeX Live)                         │
│  → Output: paper/paper.tex + paper/paper.pdf                  │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install

```bash
npm install -g researchclaw
# or
npx researchclaw --help
```

### 2. Set API Key

ResearchClaw uses your LLM provider's API key. No configuration files needed.

```bash
# Anthropic (recommended)
export ANTHROPIC_API_KEY=sk-ant-...

# OpenAI
export OPENAI_API_KEY=sk-...

# Google Gemini
export GEMINI_API_KEY=...

# OpenRouter (access any model)
export OPENROUTER_API_KEY=...
```

### 3. Run

```bash
# Start a research pipeline with a natural language goal
researchclaw research "I'm interested in video large models and want to publish a paper"

# With custom workspace and model
researchclaw research "Novel attention mechanisms for long-context LLMs" \
  --workspace ./my-research \
  --provider anthropic \
  --model claude-opus-4-5

# Resume an interrupted pipeline
researchclaw research "..." --workspace ./my-research --skip-survey

# Check pipeline status
researchclaw research-status ./my-research

# Write paper from completed experiments
researchclaw write ./my-research
```

## Commands

### `researchclaw research <goal>`

Start or resume a full research pipeline.

| Option | Default | Description |
|--------|---------|-------------|
| `-w, --workspace <dir>` | `./research-workspace` | Directory for all research artifacts |
| `--provider <provider>` | `anthropic` | LLM provider: `anthropic`, `openai`, `google`, `openrouter`, `groq` |
| `--model <model>` | provider default | Model ID (e.g., `claude-opus-4-5`, `gpt-4o`) |
| `--skip-survey` | `false` | Skip survey stage (use existing state) |
| `--skip-execution` | `false` | Survey only, skip experiments |
| `--survey-timeout <min>` | `30` | Survey agent timeout in minutes |
| `--planner-timeout <min>` | `10` | Planner agent timeout in minutes |
| `--executor-timeout <min>` | `45` | Executor agent timeout in minutes |

### `researchclaw write <workspace>`

Write a paper from completed experiment results.

| Option | Default | Description |
|--------|---------|-------------|
| `--provider <provider>` | `anthropic` | LLM provider |
| `--model <model>` | provider default | Model ID |
| `--no-pdf` | `false` | Skip PDF compilation |
| `--timeout <min>` | `30` | Paper writer timeout in minutes |

### `researchclaw research-status <workspace>`

Show the current status of a research pipeline.

## Workspace Structure

After running, your workspace contains:

```
research-workspace/
├── research-state.json          # Pipeline state (resumable)
├── survey-report.md             # Literature survey report
├── todo-list.md                 # Experiment plan
├── references/                  # References organized by section
│   ├── refs-introduction.md
│   ├── refs-related-work.md
│   ├── refs-method.md
│   └── refs-experiments.md
├── experiment-results/          # Experiment result files
│   ├── result-task-1-*.md
│   └── result-task-2-*.md
└── paper/                       # Generated paper
    ├── paper.tex                # LaTeX source
    ├── references.bib           # BibTeX references
    ├── paper.pdf                # Compiled PDF (if TeX Live installed)
    └── compile.log              # Compilation log (if failed)
```

## PDF Compilation

To compile the generated LaTeX paper to PDF, install TeX Live:

```bash
# Ubuntu/Debian
sudo apt-get install texlive-full

# macOS
brew install --cask mactex

# Then compile manually if needed
cd research-workspace/paper
pdflatex paper.tex
bibtex paper
pdflatex paper.tex
```

## Architecture

ResearchClaw is built on top of OpenClaw's powerful agent runtime:

- **Survey Agent**: Uses web search + PDF tools to collect papers and generate ideas
- **Planner Agent**: Reads state and produces structured JSON todo lists
- **Executor Agent**: Has full bash/Python access to run real experiments
- **Paper Writer Agent**: Synthesizes all artifacts into a LaTeX paper

All agents use OpenClaw's `runEmbeddedPiAgent` under the hood, giving them access to:
- Web search and fetch
- Bash/shell execution
- File system access
- PDF reading
- Memory tools
- Sub-agent spawning

## Differences from OpenClaw

ResearchClaw removes OpenClaw's messaging/channel infrastructure and adds:

| Removed | Added |
|---------|-------|
| Telegram, Slack, Discord, WhatsApp, Signal channels | `research` command |
| Gateway server | `write` command |
| Setup wizard | `research-status` command |
| iOS/macOS apps | Survey Agent |
| Plugin SDK (messaging) | Planner Agent |
| TTS/voice tools | Executor Agent |
| Canvas tools | Paper Writer Agent |
| Cron/daemon | Research state management |
| | LaTeX + PDF compilation |
| | Research-specific skills |

## License

MIT — same as OpenClaw.
