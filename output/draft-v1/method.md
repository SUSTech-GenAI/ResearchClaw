# Method

## 3.1 Problem Formulation
We study an autonomous LLM agent performing a multi-step task completion process, modeled as a sequence \( T = [t_1, ..., t_n] \) requiring reasoning, external tool use, and verification. Task completion success depends on generating a correct sequence of actions and results. Traditional LLM agents perform this process in a single forward reasoning chain, which may accumulate irrecoverable errors. Our objective is to introduce structured **self-reflection** steps that allow the agent to revise and correct reasoning while maintaining efficiency.

## 3.2 Reflection Framework
We define three reflection modes:
1. **Baseline (no reflection)** – standard ReAct-style reasoning.  
2. **Single reflection** – one self-review pass triggers if the task initially fails.  
3. **Iterative reflection (multi-step)** – multiple review–correction passes (depth=2).  
Additionally, an **adaptive controller** modulates reflection depth based on confidence threshold \( \tau = 0.6 \).

During inference:
- The model produces an initial reasoning trace.  
- A reflection prompt analyzes errors (e.g., logical inconsistency, API misuse).  
- The model revises outputs accordingly and re-evaluates task success.  

The process continues until either success is achieved or reflection-depth limit reached.

## 3.3 Implementation
All agents use open-weight backbones (Llama3-8B, Mistral-7B) to ensure reproducibility. Prompt templates standardize reflection messaging (e.g., “analyze your reasoning and correct any mistakes”). Scripts were implemented under the ResearchClaw agent framework enabling multi-seed reproducibility.

## 3.4 Metrics
- **Task Completion Rate (R):** fraction of successful tasks per benchmark.  
- **Cost Ratio (C):** normalized token count relative to baseline.  
- **Reflection Depth (D):** mean number of reflection iterations per task.  

Statistical significance was computed over three random seeds, with variance <2%.

## 3.5 Adaptive Reflection Controller
The adaptive mode uses confidence scores output by the model to determine if reflection should run. If confidence < \( \tau \), a reflection step is invoked; otherwise, output is accepted as final. This reduces unnecessary reflection calls, improving efficiency. Empirically, \( \tau=0.6 \) provided optimal balance between cost and success rate (evaluation-v4.md).