---
name: experiment-executor
description: Experiment execution skill for ResearchClaw — enables running ML experiments, writing code, and producing structured results.
version: 1.0.0
---

# Experiment Executor Skill

This skill provides the ResearchClaw executor agent with specialized capabilities for running ML/AI experiments.

## Capabilities

### Environment Setup
- Install Python packages: `pip install torch transformers datasets accelerate`
- Set up CUDA/GPU environment if available
- Download datasets from HuggingFace: `from datasets import load_dataset`
- Clone model repositories from GitHub

### Code Writing
- Write clean, well-commented Python code
- Implement models using PyTorch or HuggingFace Transformers
- Write training loops with proper logging (tqdm, wandb optional)
- Implement evaluation metrics

### Experiment Execution
- Run training scripts with appropriate hyperparameters
- Monitor training progress and detect issues early
- Save checkpoints and results to the workspace
- Handle OOM errors by reducing batch size

### Result Recording
- Measure and record all relevant metrics
- Save results to `experiment-results/` directory
- Write clear summaries of findings
- Note unexpected observations for the planner

## Best Practices

1. **Start simple**: Always implement a minimal working version first
2. **Fail fast**: Check for obvious issues before long training runs
3. **Save everything**: Save models, logs, and intermediate results
4. **Be honest**: Report failures clearly with diagnostic information
5. **Measure properly**: Use appropriate evaluation protocols

## Common Patterns

### HuggingFace Training
```python
from transformers import AutoModelForSequenceClassification, Trainer, TrainingArguments
model = AutoModelForSequenceClassification.from_pretrained("bert-base-uncased")
args = TrainingArguments(output_dir="./results", num_train_epochs=3)
trainer = Trainer(model=model, args=args, train_dataset=train_data, eval_dataset=eval_data)
trainer.train()
results = trainer.evaluate()
```

### Result Output
Always end with a JSON result block:
```json
{
  "taskId": "task-1",
  "taskTitle": "...",
  "summary": "...",
  "findings": ["..."],
  "metrics": {"accuracy": 0.85},
  "status": "done"
}
```
