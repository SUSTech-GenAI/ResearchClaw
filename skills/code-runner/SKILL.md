---
name: code-runner
description: "Execute code, scripts, and experiment commands with environment management, process control, and full logging."
metadata:
  { "openclaw": { "emoji": "▶️" } }
---

# Code Runner

Execute experiment code with environment isolation, async process management, and comprehensive logging.

## Available Execution Tools

| Tool | Use Case | Blocking? |
|------|----------|-----------|
| `run_code` | Quick inline scripts (< 2 min) | Yes (sync, 120s timeout) |
| `setup_env` | Create venv + install packages per experiment | Yes (sync, 300s timeout) |
| `process_start` | Launch long-running experiments | No (returns process ID) |
| `process_poll` | Check status + get output of background process | Yes (instant) |
| `process_kill` | Terminate a running process | Yes (instant) |

## Execution Modes

### Mode 1: Quick Script (< 2 min)

For short computations, data parsing, or sanity checks:

```
run_code("import json; print(json.load(open('results.json'))['accuracy'])", "python")
```

### Mode 2: Full Experiment (recommended)

For experiments that need dependencies and may run longer:

```
Step 1: Write experiment code
  → write_file(".../experiments/exp1/code/train.py", code)

Step 2: Set up environment
  → setup_env(".../experiments/exp1", ["torch", "numpy", "scikit-learn"])

Step 3: Start experiment
  → process_start("python code/train.py --seed 42", ".../experiments/exp1")
  → Returns: proc-a1b2c3d4

Step 4: Poll until done
  → process_poll("proc-a1b2c3d4")
  → Status: running / stdout incremental output
  → process_poll("proc-a1b2c3d4")
  → Status: completed (exit 0) / final output

Step 5: Read results
  → read_file(".../experiments/exp1/results/metrics.json")
```

## Environment Management

Each experiment gets its own isolated Python environment via `uv`:

- `setup_env(experiment_dir, packages)` creates `.venv/` inside the experiment directory
- `process_start` automatically activates the `.venv` if present (set `use_venv=false` to skip)
- Different experiments can have different package versions without conflicts

## Execution Protocol

### Before Running

1. **Write the code first** — Save scripts to `experiments/<name>/code/`
2. **Install dependencies** — Use `setup_env` with the required packages
3. **Log the configuration** — Save command, arguments, and seeds

### Running Experiments

1. Start with `process_start(command, workdir)`
2. Poll with `process_poll(process_id)` — returns incremental output
3. Keep polling until status changes from "running" to "completed" or "failed"
4. Save raw outputs to `experiments/<name>/logs/`

### After Running

1. **Check exit status** from the final `process_poll`
2. **Parse results** from output files
3. **Write execution report** to `reports/execution-report-v<N>.md`

## Error Handling

When an experiment fails:

1. **Check stderr** from `process_poll` output
2. **Diagnose** common causes:
   - Missing dependency → add to `setup_env` packages and retry
   - Out of memory → reduce batch size, log the adjustment
   - Timeout → use `process_kill` and try a smaller scale
3. **Retry once** with the fix
4. **Always report** — log failures in the execution report

## Multi-Seed Runs

For reproducibility, run each configuration with multiple seeds:

```
for seed in [42, 123, 456]:
    process_start(f"python code/train.py --seed {seed}", workdir)
    # poll each to completion
```

## Do NOT

- Run code without logging the command and output
- Use `run_code` with `pip install` — use `setup_env` instead
- Silently change experiment parameters
- Delete or overwrite previous run logs
- Ignore failures — always log them even if continuing
