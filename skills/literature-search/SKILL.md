---
name: literature-search
description: "Search for academic papers, technical reports, and web resources related to a research topic. Use when surveying related work, finding baselines, or checking prior art."
metadata:
  { "openclaw": { "emoji": "🔍" } }
---

# Literature Search

Search for and organize academic literature and technical resources for research projects.

## When to Use

- **Researcher**: Survey related work, find prior art, identify baselines, validate novelty
- **Executor**: Find implementation details, baseline code, datasets, benchmarks
- **Writer**: Complete citations, find references for related work section

## Search Methods

### Web Search
Use web search to find papers and resources:
```
Search: "<topic> site:arxiv.org"
Search: "<topic> site:aclanthology.org"
Search: "<topic> site:openreview.net"
Search: "<topic> benchmark dataset"
Search: "<topic> github implementation"
```

### Targeted Paper Lookup
When you know a specific paper:
```
Search: "<paper title> <first author> arxiv"
Search: "<paper title> pdf"
```

### Survey Existing Work
When understanding a field:
```
Search: "<topic> survey 2024 2025"
Search: "<topic> review state of the art"
```

## Output Format

Save search results to `literature/` using this format:

### Citation Card (`literature/cards/<id>.md`)
```markdown
# <Paper Title>

- **Authors**: Author1, Author2, ...
- **Year**: YYYY
- **Venue**: Conference/Journal
- **URL**: https://...
- **ArXiv**: https://arxiv.org/abs/XXXX.XXXXX

## Key Contributions
- Contribution 1
- Contribution 2

## Method Summary
Brief description of the approach.

## Key Results
- Result 1 (metric: value)
- Result 2

## Relevance to Our Work
How this relates to our research question.

## BibTeX
@article{...}
```

### Paper List (`literature/paper-list.md`)
Maintain a running list:
```markdown
# Literature Review

## Core Papers
- [Author2024] Title - relevance note
- [Author2023] Title - relevance note

## Baselines
- [Baseline1] Title - what it provides

## Datasets & Benchmarks
- Dataset1 - description, URL
```

### BibTeX File (`literature/references.bib`)
Accumulate BibTeX entries for all cited papers.

## Guidelines

1. **Prioritize recent work** — Focus on 2023-2026 papers unless citing foundational work
2. **Check multiple sources** — ArXiv, ACL Anthology, OpenReview, Google Scholar
3. **Record everything** — Even if a paper isn't directly useful, note why you looked at it
4. **Extract actionable info** — Don't just list papers; note what's useful for our project
5. **Track baselines** — Identify state-of-the-art results on relevant benchmarks

## Do NOT

- Fabricate citations or paper details
- Cite papers you haven't at least read the abstract of
- Ignore contradictory findings — note them explicitly
