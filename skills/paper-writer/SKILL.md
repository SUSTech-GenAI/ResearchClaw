---
name: paper-writer
description: Academic paper writing skill for ResearchClaw — enables writing publication-quality LaTeX papers based on research results.
version: 1.0.0
---

# Paper Writer Skill

This skill provides the ResearchClaw paper writer agent with specialized capabilities for academic writing.

## Paper Structure (NeurIPS/ICML/ICLR Style)

### Title & Abstract
- Title: Concise, informative, highlighting the key contribution
- Abstract: 150-250 words covering: motivation, method, results, significance

### Introduction (1-1.5 pages)
- Hook: Why is this problem important?
- Problem statement: What exactly are we solving?
- Limitations of existing work: What's missing?
- Our approach: Brief description of the method
- Contributions: Bulleted list of 3-5 key contributions
- Paper organization: "The rest of the paper is organized as follows..."

### Related Work (0.5-1 page)
- Organized by theme, not chronologically
- Compare and contrast with our approach
- Cite all relevant papers

### Method (1.5-2 pages)
- Problem formulation with notation
- Method description with equations
- Algorithm pseudocode if helpful
- Intuition and motivation for design choices

### Experiments (1.5-2 pages)
- Experimental setup: datasets, baselines, metrics, implementation details
- Main results table
- Ablation studies
- Qualitative examples

### Analysis (0.5-1 page)
- Deeper analysis of results
- Failure cases and limitations
- Insights and observations

### Conclusion (0.25 page)
- Summary of contributions
- Limitations
- Future work

## LaTeX Template

```latex
\documentclass[10pt,twocolumn]{article}
\usepackage{amsmath,amssymb,graphicx,booktabs,hyperref,natbib}
\usepackage[margin=1in]{geometry}

\title{Your Paper Title}
\author{Anonymous Authors}
\date{}

\begin{document}
\maketitle

\begin{abstract}
...
\end{abstract}

\section{Introduction}
...

\section{Related Work}
...

\section{Method}
...

\section{Experiments}
...

\section{Conclusion}
...

\bibliographystyle{plainnat}
\bibliography{references}

\end{document}
```

## Citation Guidelines
- Use `\cite{key}` for inline citations
- BibTeX key = paper ID with non-alphanumeric chars removed
- Cite at least 20 papers
- Every factual claim about prior work must be cited
