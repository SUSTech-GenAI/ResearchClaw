---
name: section-writer
description: "Draft individual paper sections (abstract, introduction, method, experiments, conclusion) based on outline and evidence. Use when writing or revising specific sections of a paper."
metadata:
  { "openclaw": { "emoji": "✍️" } }
---

# Section Writer

Draft individual paper sections grounded in evidence from the workspace.

## When to Use

- **Writer**: Draft or revise specific sections based on the outline
- **Researcher**: Review drafted sections for accuracy (reading, not writing)

## Input

- `writing/draft-v<N>/outline.md` — The paper outline with evidence inventory
- `spec/research-spec.md` — Research question and hypothesis
- `experiments/*/results/` — Metrics and data for experiment sections
- `literature/` — References for related work and citations
- `reports/evaluation-v<N>.md` — Researcher's interpretation of results

## Output

Write each section to `writing/draft-v<N>/<section-name>.md`:
- `writing/draft-v<N>/abstract.md`
- `writing/draft-v<N>/introduction.md`
- `writing/draft-v<N>/related-work.md`
- `writing/draft-v<N>/method.md`
- `writing/draft-v<N>/experiments.md`
- `writing/draft-v<N>/conclusion.md`

## Section Guidelines

### Abstract
- 150-250 words
- Structure: problem → approach → key result → significance
- Must be self-contained (readable without the paper)
- Include one concrete quantitative result
- No citations, no jargon that isn't immediately defined

### Introduction
- Start with motivation (why does this problem matter?)
- State the gap (what's missing in current work?)
- Present contributions as a numbered list
- End with paper structure roadmap
- Key rule: every claim in the intro must be backed by evidence later in the paper

### Related Work
- Organize by theme/category, not chronologically
- For each category: summarize the landscape, then position our work
- End with a summary of how our work differs
- Use citations from `literature/`

### Method
- Start with problem formulation (notation, formal definition)
- Present approach at a high level first, then details
- Include algorithm boxes or pseudocode for complex procedures
- Reference figures for architecture/pipeline overview
- Be precise enough for reproduction

### Experiments
- Setup paragraph: datasets, baselines, metrics, implementation details
- Present tables with explanation (don't just show numbers)
- For each result: state the finding, then explain why it matters
- Ablation section: one paragraph per ablation explaining the purpose and result
- Use exact numbers from `experiments/*/results/metrics-summary.md`

### Conclusion
- Summarize contributions (don't copy-paste from intro, rephrase)
- State the key takeaway
- Briefly mention limitations and future work
- Keep concise (0.5 page)

## Writing Style

- **Active voice** preferred ("We propose..." not "It is proposed...")
- **Precise language** — avoid vague qualifiers ("significantly" only with statistical significance)
- **Consistent terminology** — use the same term for the same concept throughout
- **Paragraph structure** — topic sentence → evidence → interpretation
- **Transitions** — connect paragraphs and sections logically

## Evidence Linking

Every factual claim must reference its source. Use inline markers:

```markdown
Our method achieves 89.2% accuracy, outperforming the strongest baseline by 4.2%
[source: experiments/exp1/results/metrics-summary.md, Table: Main Results].
```

If you cannot find evidence for a claim, mark it:

```markdown
[EVIDENCE NEEDED: No experimental support for this claim. Consider adding to next experiment plan.]
```

## Revision Mode

When revising an existing section:
1. Read the existing draft
2. Read any feedback from `reports/` or user comments
3. Make targeted changes, don't rewrite from scratch unless requested
4. Mark changes with `[REVISED]` tags for easy review
5. Update the evidence inventory in the outline if new claims are added

## Do NOT

- Invent experimental results not in the workspace
- Claim statistical significance without actual tests
- Copy text from papers without proper attribution
- Write sections out of order relative to evidence (don't write experiments before results exist)
- Use placeholder numbers — always pull real data from experiment results
