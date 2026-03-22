---
name: experiment-planner
description: "Design experiment matrices with baselines, metrics, datasets, and acceptance criteria. Use when translating a research plan into concrete experiment specifications."
metadata:
  { "openclaw": { "emoji": "🧪" } }
---

# Experiment Planner

Design structured experiment plans that translate high-level research goals into concrete, executable experiment specifications.

## When to Use

- **Researcher**: Define what experiments to run, what to compare, and how to judge success
- **Executor**: Understand experiment requirements before decomposing into tasks

## Experiment Plan Format

Generate experiment plans as `plans/plan-v<N>.md`:

```markdown
# Research Plan v<N>

## Iteration Goal
What are we trying to learn in this iteration?

## Experiments

### Experiment 1: <descriptive-name>

#### Hypothesis
"We expect [X] because [Y]."

#### Setup
- **Dataset**: Name, source, size, preprocessing steps
- **Environment**: Python version, key libraries, hardware requirements
- **Random seeds**: [42, 123, 456] (use at least 3 seeds for variance)

#### Baselines
| Name | Description | Source |
|------|-------------|--------|
| baseline-1 | ... | paper/repo URL |
| baseline-2 | ... | paper/repo URL |

#### Proposed Method
Brief description of our approach and how it differs from baselines.

#### Metrics
| Metric | Description | Higher/Lower is better |
|--------|-------------|----------------------|
| accuracy | ... | Higher |
| latency | ... | Lower |

#### Acceptance Criteria
- [ ] Metric X > threshold Y on dataset Z
- [ ] Statistical significance: p < 0.05 (paired t-test)
- [ ] Runtime within budget: < N hours

#### Ablation Studies (if applicable)
- Ablation 1: Remove component X, measure impact
- Ablation 2: Vary hyperparameter Y in [a, b, c]

#### Priority
High / Medium / Low

#### Estimated Runtime
Approximate wall-clock time needed.
```

## Design Principles

1. **Start simple** — Design the minimum experiment that tests the hypothesis
2. **Always include baselines** — No result is meaningful without comparison
3. **Multiple seeds** — Single-run results are unreliable; plan for at least 3 seeds
4. **Clear acceptance criteria** — Define success BEFORE running experiments
5. **Ablations matter** — If main result is positive, plan ablations to understand why
6. **Resource awareness** — Consider compute budget and time constraints

## Experiment Matrix

For systematic comparisons, use an experiment matrix:

```markdown
## Experiment Matrix

| Config | Model | Dataset | Method | Seed |
|--------|-------|---------|--------|------|
| exp-1a | base  | dataset-A | baseline | 42 |
| exp-1b | base  | dataset-A | proposed | 42 |
| exp-1c | base  | dataset-A | baseline | 123 |
| exp-1d | base  | dataset-A | proposed | 123 |
| ...    | ...   | ...       | ...      | ... |
```

## Do NOT

- Design experiments without clear hypotheses
- Skip baselines ("our method is obviously better")
- Use only one random seed
- Set acceptance criteria after seeing results (p-hacking)
- Plan more experiments than resources allow
