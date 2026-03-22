---
name: result-parser
description: "Parse experiment logs, extract metrics, generate comparison tables, and produce structured result packages. Use after experiments complete to organize raw outputs into analyzable formats."
metadata:
  { "openclaw": { "emoji": "📊" } }
---

# Result Parser

Parse raw experiment outputs into structured, analyzable result packages.

## When to Use

- **Executor**: After experiments finish, to extract metrics and build comparison tables
- **Researcher**: When reviewing results for evaluation (reading parsed outputs)
- **Writer**: When converting results into paper-ready tables and figures

## Input

Raw experiment outputs from:
- `experiments/<name>/logs/` — Run logs with stdout/stderr
- `experiments/<name>/results/` — Any structured output files (JSON, CSV, etc.)
- `experiments/<name>/run-log.md` — Run metadata

## Output

Write parsed results to `experiments/<name>/results/`:

### 1. Metrics Summary (`metrics-summary.md`)

```markdown
# Metrics Summary: <experiment-name>

## Configuration
- Plan: plans/plan-v<N>.md
- Date: <ISO date>
- Seeds: [42, 123, 456]

## Results Table

| Method | Metric1 (mean±std) | Metric2 (mean±std) | Metric3 (mean±std) |
|--------|-------------------|-------------------|-------------------|
| Baseline-A | 0.82 ± 0.01 | 12.3 ± 0.5 | 0.91 ± 0.02 |
| Baseline-B | 0.85 ± 0.02 | 11.1 ± 0.3 | 0.89 ± 0.01 |
| **Proposed** | **0.89 ± 0.01** | **9.8 ± 0.4** | **0.93 ± 0.01** |

## Per-Seed Results

### Seed 42
| Method | Metric1 | Metric2 | Metric3 |
|--------|---------|---------|---------|
| Baseline-A | 0.83 | 12.1 | 0.92 |
| Proposed | 0.90 | 9.5 | 0.94 |

### Seed 123
...

### Seed 456
...

## Observations
- Proposed method outperforms all baselines on Metric1 by +4-7%
- Improvement is consistent across all seeds (low variance)
- Metric2 shows the largest relative improvement (20% reduction)
- Note: Baseline-B was not tested on seed 456 due to OOM (see run-log.md)
```

### 2. Raw Metrics JSON (`metrics.json`)

```json
{
  "experiment": "<experiment-name>",
  "plan_version": "<N>",
  "timestamp": "<ISO date>",
  "methods": {
    "baseline-a": {
      "42":  { "metric1": 0.83, "metric2": 12.1, "metric3": 0.92 },
      "123": { "metric1": 0.81, "metric2": 12.5, "metric3": 0.90 },
      "456": { "metric1": 0.82, "metric2": 12.3, "metric3": 0.91 }
    },
    "proposed": {
      "42":  { "metric1": 0.90, "metric2": 9.5, "metric3": 0.94 },
      "123": { "metric1": 0.88, "metric2": 10.1, "metric3": 0.93 },
      "456": { "metric1": 0.89, "metric2": 9.8, "metric3": 0.92 }
    }
  },
  "aggregated": {
    "baseline-a": { "metric1": { "mean": 0.82, "std": 0.01 } },
    "proposed": { "metric1": { "mean": 0.89, "std": 0.01 } }
  }
}
```

## Parsing Strategies

### From Log Files
- Look for printed metrics lines (e.g., `Accuracy: 0.89`, `Loss: 0.34`)
- Handle different output formats: key=value, JSON, CSV, table output
- Extract timing information for runtime analysis

### From CSV/JSON Output
- Read structured output files directly
- Aggregate across seeds (mean, std, min, max)

### From Training Logs
- Extract final epoch metrics
- Track convergence (optional: best epoch metrics vs. final epoch)

## Comparison Guidelines

1. **Always compute mean and std across seeds** — Single numbers are misleading
2. **Bold the best result** in each column of comparison tables
3. **Note missing data** — If a run failed or was skipped, mark it explicitly
4. **Report relative improvements** — "Proposed is X% better than best baseline"
5. **Flag suspicious results** — Unusually high variance, much better than expected, or inconsistent across seeds

## Do NOT

- Fabricate or impute missing data points
- Silently drop failed runs from averages
- Cherry-pick the best seed for comparison
- Round aggressively (keep at least 2 significant digits)
- Make causal claims — just report the numbers and factual observations
