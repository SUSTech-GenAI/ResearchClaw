---
name: task-decomposer
description: "Break high-level research goals into concrete, ordered, executable tasks with dependencies and resource requirements. Use when an experiment plan needs to become actionable steps."
metadata:
  { "openclaw": { "emoji": "📋" } }
---

# Task Decomposer

Break a high-level experiment plan into a concrete, ordered task list that can be executed step-by-step.

## When to Use

- **Executor**: After receiving an experiment plan from the Researcher, before starting execution
- **Researcher**: When estimating effort or reviewing whether a plan is feasible

## Input

Read the experiment plan from `plans/plan-v<N>.md` and the research context from `spec/research-spec.md`.

## Output Format

Write the task breakdown to `experiments/<experiment-name>/task-list.md`:

```markdown
# Task List: <experiment-name>

Source plan: plans/plan-v<N>.md
Created: <ISO date>

## Prerequisites
- [ ] Python >= 3.10 with venv
- [ ] GPU available (if needed)
- [ ] Dataset X downloaded to data/

## Tasks

### Task 1: Environment Setup
- **Description**: Create virtualenv, install dependencies
- **Commands**: `python -m venv .venv && pip install -r requirements.txt`
- **Depends on**: Prerequisites
- **Estimated time**: 5 min
- **Status**: pending

### Task 2: Data Preparation
- **Description**: Download and preprocess dataset
- **Commands**: `python scripts/prepare_data.py --dataset <name>`
- **Depends on**: Task 1
- **Estimated time**: 10 min
- **Status**: pending

### Task 3: Baseline Run
- **Description**: Run baseline method with seeds [42, 123, 456]
- **Commands**: `python run.py --method baseline --seed {seed}`
- **Depends on**: Task 2
- **Estimated time**: 30 min
- **Status**: pending

### Task 4: Proposed Method Run
- **Description**: Run proposed method with same seeds
- **Commands**: `python run.py --method proposed --seed {seed}`
- **Depends on**: Task 2
- **Estimated time**: 30 min
- **Status**: pending

### Task 5: Results Collection
- **Description**: Parse all run outputs into comparison table
- **Depends on**: Task 3, Task 4
- **Estimated time**: 5 min
- **Status**: pending
```

## Decomposition Principles

1. **Atomic tasks** — Each task should do one thing and have a clear completion condition
2. **Explicit dependencies** — State what must finish before each task can start
3. **Executable commands** — Include the actual commands or code to run, not vague descriptions
4. **Fail-safe ordering** — Put environment setup and data prep before any experiment runs
5. **Status tracking** — Mark each task as `pending`, `running`, `done`, or `failed`

## Granularity Guidelines

- **Too coarse**: "Run all experiments" — not decomposed enough
- **Too fine**: "Import numpy" — unnecessary detail
- **Right level**: "Run baseline method on dataset-A with 3 seeds, save results to experiments/exp1/results/baseline/"

## Handling Multiple Experiments

If the plan contains multiple experiments, create separate task lists:
- `experiments/exp-1/task-list.md`
- `experiments/exp-2/task-list.md`

Or a combined list with clear grouping if experiments share setup steps.

## Do NOT

- Change the experiment design (that's the Researcher's plan)
- Skip baselines or reduce the number of seeds
- Add experiments not in the plan
- Omit error handling steps (always include "what to do if X fails")
