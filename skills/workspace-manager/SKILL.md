---
name: workspace-manager
description: "Initialize, read, and manage ResearchClaw project workspace directories and state. Use when creating projects, checking project status, or navigating workspace artifacts."
metadata:
  { "openclaw": { "emoji": "📁" } }
---

# Workspace Manager

Manage the ResearchClaw research project workspace. This skill helps you navigate, read, and organize the shared workspace that all agents (Researcher, Executor, Writer) use to collaborate.

## Workspace Structure

A ResearchClaw project workspace has this structure:

```
<project>/
  .researchclaw/          # Internal config and agent state
    config.json5          # Project configuration
    state.json            # Current project stage and iteration
    agents/               # Per-agent working directories
  spec/                   # Research specifications
    research-spec.md      # The living research spec document
  literature/             # Papers, citations, bib files
  plans/                  # Research plans (versioned: plan-v1.md, plan-v2.md, ...)
  experiments/            # Experiment code, configs, logs, results
  reports/                # Execution reports, evaluation reports
  writing/                # Paper outlines and drafts
  memory/                 # Project memory and decision log
    MEMORY.md             # Key decisions and learnings
```

## When to Use

- **Starting work**: Read `.researchclaw/state.json` to understand current project stage
- **Checking context**: Read `memory/MEMORY.md` for project history
- **Finding artifacts**: List files in relevant directories
- **Saving outputs**: Write files to the appropriate directory with version naming

## Conventions

### File Versioning
Use version suffixes for evolving documents:
- `plans/plan-v1.md`, `plans/plan-v2.md`
- `reports/execution-report-v1.md`, `reports/evaluation-v1.md`
- `writing/draft-v1/`, `writing/draft-v2/`

### State Updates
After significant actions, update `.researchclaw/state.json`:
```json
{
  "currentStage": "planning|executing|evaluating|writing|iterating",
  "iteration": <number>,
  "updatedAt": "<ISO timestamp>"
}
```

### Memory Updates
After each iteration, append to `memory/MEMORY.md`:
```markdown
## Iteration <N> - <date>
- **Decision**: What was decided and why
- **Key finding**: What was learned
- **Next direction**: What comes next
```

## Do NOT

- Overwrite files without versioning (always create new versions)
- Write to directories outside the project workspace
- Delete experiment results or reports

## Artifact Tracking

Maintain `.researchclaw/artifacts.md` as an index of all project artifacts:

```markdown
# Artifact Index

## Specs
- spec/research-spec.md — Living research specification

## Plans
- plans/plan-v1.md — Initial experiment plan (iteration 1)
- plans/plan-v2.md — Revised plan after first evaluation (iteration 2)

## Experiments
- experiments/exp1-baseline-comparison/
  - task-list.md — Task breakdown
  - run-log.md — Execution log
  - logs/ — Raw run outputs
  - results/metrics-summary.md — Parsed metrics
  - results/metrics.json — Machine-readable metrics

## Reports
- reports/execution-report-v1.md — Results of plan-v1
- reports/evaluation-v1.md — Researcher evaluation of v1 results

## Writing
- writing/draft-v1/outline.md — Paper outline

## Updated
<ISO timestamp>
```

After creating any new artifact, append it to this index. This gives all agents a quick overview of what exists without scanning directories.

## Cross-Iteration Comparison

When multiple iterations exist, create `reports/comparison.md`:

```markdown
# Cross-Iteration Comparison

| Iteration | Plan | Key Change | Best Metric1 | Best Metric2 | Decision |
|-----------|------|-----------|-------------|-------------|----------|
| v1 | plan-v1 | Initial baseline | 0.82 | 12.3 | Continue |
| v2 | plan-v2 | Added method X | 0.89 | 9.8 | Write up |
```

This helps the Researcher track progress across the full research loop.
