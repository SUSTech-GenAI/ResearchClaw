---
name: spec-writer
description: "Generate and update research specification documents. Use when formalizing a research idea into a structured spec with hypotheses, scope, constraints, and success criteria."
metadata:
  { "openclaw": { "emoji": "📋" } }
---

# Spec Writer

Generate and maintain the research specification document (`spec/research-spec.md`). This is the central document that defines what the project is investigating and how success is measured.

## When to Use

- Turning a vague idea into a structured research spec
- Updating the spec after new findings or direction changes
- Adding or refining success criteria and hypotheses

## Research Spec Format

Generate or update `spec/research-spec.md` following this structure:

```markdown
# Research Spec: <Project Title>

## Project ID
<unique-id>

## Problem Statement
What problem are we solving? Why does it matter?
Be specific — avoid vague statements like "improve performance."

## Hypothesis
What do we believe to be true? What are we testing?
Format: "We hypothesize that [approach] will [outcome] because [reasoning]."

## Scope
What is in scope for this project?
- In scope: [list]
- Out of scope: [list]

## Constraints
- Time/resource constraints
- Technical constraints
- Data availability constraints

## Success Criteria
Quantitative and qualitative criteria for judging results:
1. [Criterion 1]: [metric] [threshold] (e.g., "Accuracy > 85% on benchmark X")
2. [Criterion 2]: ...

## Current Stage
[init | planning | executing | evaluating | writing | iterating]

## Research Plan Summary
Brief description of the current high-level plan.

## Key Findings (updated per iteration)
### Iteration 1
- Finding: ...
- Implication: ...

## Next Actions
- [ ] Action 1
- [ ] Action 2

## Open Questions
- Question 1
- Question 2
```

## Guidelines

1. **Be precise** — "Improve LLM reasoning" is too vague; "Improve GSM8K accuracy by 5% using chain-of-thought prompting" is specific
2. **Testable hypotheses** — Every hypothesis must have a clear way to confirm or reject it
3. **Measurable criteria** — Success criteria should include numbers where possible
4. **Living document** — Update the spec as understanding evolves; never let it become stale
5. **Preserve history** — When updating, add to "Key Findings" rather than deleting previous content

## Do NOT

- Create overly ambitious specs that can't be tested in one iteration
- Leave success criteria vague ("make it better")
- Fabricate constraints that don't exist
