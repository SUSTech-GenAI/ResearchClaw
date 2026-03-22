---
name: bib-exporter
description: "Export references as a clean .bib file and generate formatted reference lists. Use when finalizing paper references for submission."
metadata:
  { "openclaw": { "emoji": "📑" } }
---

# Bib Exporter

Export and validate the project bibliography for paper submission.

## When to Use

- **Writer**: Finalizing references for paper submission
- **Researcher**: Checking reference completeness

## Export Tasks

### Validate References
Check `literature/references.bib` for:
1. All citation keys used in drafts have BibTeX entries
2. No duplicate entries
3. Required fields present (title, author, year, venue)
4. Consistent formatting

### Export Clean Bib
Generate `writing/draft-v<N>/references.bib` containing only the references actually cited in the draft:

1. Scan all `writing/draft-v<N>/*.md` files for `\cite{key}` and `\citet{key}` patterns
2. Extract unique citation keys
3. Copy matching entries from `literature/references.bib`
4. Write the filtered bib file

### Generate Reference List
For markdown drafts, generate `writing/draft-v<N>/references.md`:

```markdown
# References

[1] Smith, J. and Doe, J. (2024). "Method Title." In NeurIPS.
[2] Jones, A. et al. (2023). "Another Method." In ICML.
```

## Validation Report

Write `writing/draft-v<N>/bib-report.md`:

```markdown
# Bibliography Report

## Statistics
- Total citations in draft: 25
- Unique references: 18
- References in bib file: 20

## Missing (cited but no bib entry)
- [missing_key1] — Found in section: introduction.md
- [missing_key2] — Found in section: related-work.md

## Unused (in bib but never cited)
- [unused_key1]
- [unused_key2]

## Issues
- [smith2024] missing 'booktitle' field
- [jones2023] duplicate entry detected
```

## Do NOT

- Remove unused references without confirming (they may be needed in revision)
- Change citation keys (would break references in drafts)
- Auto-fix missing references by guessing — flag them for the Writer to resolve
