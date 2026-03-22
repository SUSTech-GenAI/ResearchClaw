---
name: citation-builder
description: "Generate and manage academic citations, build reference lists, and map citations to paper sections. Use when organizing references for writing."
metadata:
  { "openclaw": { "emoji": "📚" } }
---

# Citation Builder

Generate properly formatted citations and maintain the project reference list.

## When to Use

- **Writer**: Building the references section, inserting inline citations
- **Researcher**: Organizing literature survey results into a reference list
- **Executor**: Citing baseline papers and datasets

## Reference Files

### Paper List (`literature/paper-list.md`)
Human-readable index of all referenced papers:

```markdown
# Paper List

## Core References
- [smith2024] Smith & Doe. "Method Title." NeurIPS 2024. — Main baseline.
- [jones2023] Jones et al. "Another Method." ICML 2023. — Related approach.

## Datasets
- [dataset2024] Author. "Dataset Name." 2024. — Primary evaluation dataset.

## Background
- [classic2020] Author. "Foundational Work." JMLR 2020. — Theoretical basis.
```

### BibTeX File (`literature/references.bib`)
Machine-parseable references:

```bibtex
@inproceedings{smith2024,
  title={Method Title},
  author={Smith, John and Doe, Jane},
  booktitle={NeurIPS},
  year={2024}
}
```

## Building Citations

### Adding a New Citation
1. Add BibTeX entry to `literature/references.bib`
2. Add one-line entry to `literature/paper-list.md` with relevance note
3. If a summary exists, link it: `See literature/summaries/smith2024.md`

### Inline Citation Format
In draft markdown, use LaTeX-style citation keys:

```markdown
Recent work on agent systems \cite{smith2024} has shown that...
Following the evaluation protocol of \citet{jones2023}, we...
```

### Citation Mapping
When building related work, create a mapping in the outline:

```markdown
## Citation Map
| Section | Key Citations | Purpose |
|---------|--------------|---------|
| Introduction | [smith2024], [jones2023] | Motivate the problem |
| Related Work - Topic A | [ref1], [ref2], [ref3] | Survey prior approaches |
| Method | [jones2023] | Method we extend |
| Experiments | [smith2024], [dataset2024] | Baselines and data |
```

## Do NOT

- Fabricate citation details (authors, venues, years)
- Add citations without corresponding BibTeX entries
- Use inconsistent citation keys across documents
