---
name: artifact-manager
description: "Manage structured research artifacts — save, load, and version experiment results, reports, plans, and drafts in the workspace."
metadata:
  { "openclaw": { "emoji": "📦" } }
---

# Artifact Manager

Manage structured research artifacts in the ResearchClaw workspace. Provides consistent naming, versioning, and organization for all outputs produced during the research loop.

## When to Use

- Saving experiment results in a structured format
- Creating versioned reports or plans
- Packaging results for handoff between agents
- Finding the latest version of an artifact

## Artifact Types

### Research Spec
- Location: `spec/research-spec.md`
- Single file, updated in place (history tracked in "Key Findings" section)

### Research Plans
- Location: `plans/plan-v<N>.md`
- Versioned: `plan-v1.md`, `plan-v2.md`, etc.
- Created by Researcher, consumed by Executor

### Experiment Results
- Location: `experiments/<experiment-name>/`
- Structure:
  ```
  experiments/<name>/
    config.json          # Experiment configuration
    code/                # Source code used
    logs/                # Raw execution logs
    results/             # Parsed results (metrics, tables)
    figures/             # Generated figures
    README.md            # Experiment description
  ```

### Execution Reports
- Location: `reports/execution-report-v<N>.md`
- Created by Executor after running experiments
- Contains: summary, metrics tables, observations, artifact paths

### Evaluation Reports
- Location: `reports/evaluation-v<N>.md`
- Created by Researcher after reviewing results
- Contains: critical assessment, hypothesis support analysis, next steps

### Paper Drafts
- Location: `writing/draft-v<N>/`
- Structure:
  ```
  writing/draft-v<N>/
    outline.md
    abstract.md
    introduction.md
    related-work.md
    method.md
    experiments.md
    conclusion.md
    REVIEW-NOTES.md
  ```

## Versioning Rules

1. **Never overwrite** — Always create a new version
2. **Find latest version**: List files matching the pattern, sort numerically, take the highest
3. **Next version**: Latest version number + 1
4. **Cross-reference**: When one artifact references another, use the specific version number

## Result Package Format

When the Executor delivers results, create a structured result package:

```markdown
# Result Package: <experiment-name>

## Experiment ID
<id>

## Summary
One-paragraph summary of what was done and what happened.

## Configuration
Key parameters used in this experiment.

## Metrics
| Metric | Baseline | Proposed | Delta |
|--------|----------|----------|-------|
| ...    | ...      | ...      | ...   |

## Key Observations
- Observation 1
- Observation 2

## Artifacts
- Code: `experiments/<name>/code/`
- Logs: `experiments/<name>/logs/`
- Results: `experiments/<name>/results/`

## Open Questions
- Question 1
- Question 2
```
