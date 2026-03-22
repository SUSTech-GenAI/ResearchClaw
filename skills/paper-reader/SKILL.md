---
name: paper-reader
description: "Read academic papers and extract structured summaries including problem, method, results, and relevance. Use when surveying related work or understanding baseline approaches."
metadata:
  { "openclaw": { "emoji": "📄" } }
---

# Paper Reader

Read academic papers and extract structured, actionable summaries.

## When to Use

- **Researcher**: Understand related work, evaluate baselines, find gaps in existing literature
- **Executor**: Understand baseline implementations or technical approaches to reproduce
- **Writer**: Gather information for the related work section and citations

## Input Sources

Papers can come from:
- URLs (arXiv, OpenReview, ACL Anthology, etc.)
- PDFs in the workspace `literature/` directory
- Text content provided directly

## Output Format

Write paper summaries to `literature/summaries/<paper-id>.md`:

```markdown
# Paper Summary: <title>

## Metadata
- **Authors**: <author list>
- **Venue**: <conference/journal, year>
- **URL**: <link>
- **Citation key**: <author-year format, e.g., smith2024>

## Problem
What problem does this paper address? (2-3 sentences)

## Approach
What is their proposed method? (1 paragraph)

## Key Results
- Result 1: <metric> = <value> on <dataset>
- Result 2: ...
- Comparison: Outperforms <baseline> by <margin> on <metric>

## Strengths
- ...
- ...

## Weaknesses / Limitations
- ...
- ...

## Relevance to Our Work
How does this paper relate to our research? (from spec/research-spec.md)
- **As baseline**: Could we compare against this method?
- **As inspiration**: Any techniques we could adopt?
- **As related work**: How should we position relative to this?

## Key Takeaways
1-3 bullet points of the most important things for our project.
```

## Reading Strategies

### For Related Work Surveys
- Focus on: problem definition, positioning, and results
- Extract: how they frame the problem, what baselines they use
- Note: terminology and notation conventions in the field

### For Baseline Understanding
- Focus on: method details, implementation, hyperparameters
- Extract: architecture, training procedure, evaluation protocol
- Note: any code/data availability

### For Method Inspiration
- Focus on: novel components, key insights, ablation results
- Extract: what specifically makes their approach work
- Note: failure modes and limitations

## Citation Management

After reading a paper, add its BibTeX entry to `literature/references.bib`:

```bibtex
@inproceedings{smith2024method,
  title={Paper Title},
  author={Smith, John and Doe, Jane},
  booktitle={Conference Name},
  year={2024}
}
```

And add a one-line entry to `literature/paper-list.md`:

```markdown
- [smith2024] Smith & Doe. "Paper Title." Conference 2024. — Brief relevance note.
```

## Do NOT

- Fabricate paper details not present in the source
- Summarize without reading (no guessing based on title alone)
- Skip the "Relevance to Our Work" section — this is the most valuable part
- Add citations without BibTeX entries
