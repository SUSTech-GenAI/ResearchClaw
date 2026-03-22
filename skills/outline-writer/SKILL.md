---
name: outline-writer
description: "Generate structured paper outlines from research specs and experiment results. Use when transitioning from research to writing phase."
metadata:
  { "openclaw": { "emoji": "🗂️" } }
---

# Outline Writer

Generate a structured paper outline that maps research content to academic paper sections.

## When to Use

- **Writer**: First step when starting paper drafting — create the skeleton before writing sections
- **Researcher**: Review whether the outline covers all key contributions and evidence

## Input

Read from the workspace:
- `spec/research-spec.md` — Research question, hypothesis, scope
- `reports/evaluation-v<N>.md` — Researcher's conclusions on what the results mean
- `experiments/*/results/metrics-summary.md` — Key experimental results
- `literature/` — Related work and citations

## Output

Write outline to `writing/draft-v<N>/outline.md`:

```markdown
# Paper Outline: <title>

Draft version: v<N>
Based on: spec/research-spec.md, reports/evaluation-v<latest>.md
Created: <ISO date>

## Title
<Proposed paper title — concise, specific, informative>

## Abstract (target: 150-250 words)
- **Problem**: What gap or challenge does this address?
- **Approach**: What do we propose?
- **Key result**: What is the main finding?
- **Impact**: Why does this matter?

## 1. Introduction (target: 1-1.5 pages)
- **Hook**: Why is this problem important? (1 paragraph)
- **Gap**: What is missing in current approaches? (1 paragraph)
- **Contribution**: What do we propose and what are our contributions? (1 paragraph)
  - Contribution 1: ...
  - Contribution 2: ...
  - Contribution 3: ...
- **Paper structure**: Brief roadmap (1 sentence per section)

## 2. Related Work (target: 1-1.5 pages)
- **Category A**: <topic> — Key papers: [ref1], [ref2]
- **Category B**: <topic> — Key papers: [ref3], [ref4]
- **Category C**: <topic> — Key papers: [ref5]
- **Positioning**: How our work differs from and builds upon these

## 3. Method (target: 2-3 pages)
- **3.1 Problem Formulation**: Formal definition
- **3.2 Approach Overview**: High-level description with figure reference
- **3.3 Component A**: Detail of key component
- **3.4 Component B**: Detail of key component
- **3.5 Training/Implementation Details**: Practical details

## 4. Experiments (target: 2-3 pages)
- **4.1 Setup**
  - Datasets: <list with references>
  - Baselines: <list with references>
  - Metrics: <list with definitions>
  - Implementation details: hardware, hyperparameters
- **4.2 Main Results**
  - Table 1: Main comparison (from experiments/<name>/results/)
  - Key findings: ...
- **4.3 Ablation Studies** (if applicable)
  - Table 2: Ablation results
  - What each ablation shows
- **4.4 Analysis** (optional)
  - Qualitative examples, case studies, or visualizations

## 5. Discussion (optional, target: 0.5-1 page)
- Limitations
- Broader impact
- Future directions

## 6. Conclusion (target: 0.5 page)
- Summary of contributions
- Key takeaway

## References
- List of key references to include (from literature/)

## Figures and Tables Plan
- Figure 1: Method overview diagram
- Table 1: Main results comparison
- Table 2: Ablation study
- Figure 2: <qualitative examples / visualization>

## Evidence Inventory
Map each claim to its supporting evidence:
| Claim | Evidence Source | Status |
|-------|---------------|--------|
| "Our method outperforms X" | experiments/exp1/results/ | Supported |
| "Component A is crucial" | experiments/exp2/results/ (ablation) | Supported |
| "Scales to large datasets" | NOT YET TESTED | Missing |
```

## Outline Principles

1. **Evidence-first** — Only outline claims that have experimental support
2. **Flag gaps** — Explicitly mark where evidence is missing or weak
3. **Realistic scope** — Match the outline to the actual results, not aspirational goals
4. **Standard structure** — Follow the venue's expected format (default: ML conference paper)

## Do NOT

- Outline claims without evidence (flag them as "Missing" in the evidence inventory)
- Create an outline that implies experiments we haven't done
- Skip the evidence inventory — it's the most important part
