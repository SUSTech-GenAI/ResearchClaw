# Executor Agent Protocol

## Execution Protocol

When spawned by the Researcher, follow this protocol.
Read the project root path from SOUL.md — all shared files use absolute paths under that root.

### Step 1: Understand the Task
1. Read the experiment plan referenced in the spawn task
2. Read `<project>/spec/research-spec.md` for research context
3. Identify: goal, baselines, metrics, success criteria, constraints

### Step 2: Decompose
1. Break the high-level plan into ordered, concrete tasks
2. Identify dependencies between tasks
3. List required tools, data, and environment setup
4. Create task checklist in the execution report

### Step 3: Environment Setup
1. Check/install required dependencies
2. Prepare data if needed
3. Verify baseline implementations are available
4. Set random seeds and configuration

### Step 4: Execute
For each task:
1. Log the exact command/code being run
2. Execute with timeout and error handling
3. Capture stdout, stderr, and exit codes
4. Save raw outputs to `<project>/experiments/<name>/logs/`
5. If a task fails: log the failure, attempt recovery, continue with remaining tasks

### Step 5: Parse Results
1. Extract metrics from raw outputs
2. Generate comparison tables (baseline vs. proposed)
3. Note any anomalies or unexpected behaviors
4. Save parsed results to `<project>/experiments/<name>/results/`

### Step 6: Report
Write `<project>/reports/execution-report-v<N>.md` containing:

```markdown
# Execution Report v<N>

Source plan: plans/plan-v<N>.md
Completed: <ISO date>

## Summary
Brief overview of what was executed and key outcomes.

## Tasks Completed
- [x] Task 1: description (status)
- [x] Task 2: description (status)

## Results

### Metrics Table
| Method | Metric1 | Metric2 | ... |
|--------|---------|---------|-----|
| Baseline | ... | ... | ... |
| Proposed | ... | ... | ... |

## Observations
Factual observations about the results (no judgment on hypothesis).

## Issues Encountered
Any failures, unexpected behaviors, or concerns.

## Artifacts
- experiments/<name>/code/ — Source code
- experiments/<name>/logs/ — Run logs
- experiments/<name>/results/ — Parsed results
- experiments/<name>/task-list.md — Task breakdown with status
```

## Version Tracking

- **Report version matches plan version**: `execution-report-v3.md` is the result of `plan-v3.md`
- **Never overwrite** previous reports or experiment directories
- **Experiment directories** use descriptive names: `experiments/exp1-baseline-comparison/`
- **Task list status** must be updated as tasks complete: change `pending` → `done` or `failed`

## Failure Protocol

If an experiment fails completely:
1. Log full error details in the execution report
2. Mark failed tasks in the task list
3. Report what DID work (partial results are still valuable)
4. Suggest possible fixes in the "Issues Encountered" section
5. Always deliver the report — the Researcher needs to know what happened
