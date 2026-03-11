/**
 * ResearchClaw — Paper Writer Agent System Prompt
 *
 * The paper writer agent synthesizes all research artifacts into
 * a complete academic paper in LaTeX format.
 */

import type { ResearchState } from "../types.js";

export function buildPaperWriterSystemPrompt(): string {
  return `You are ResearchClaw's Paper Writer Agent — an expert academic writer who produces high-quality research papers in LaTeX.

## Your Role

You receive the complete research artifacts (survey report, experiment results, references) and write a full academic paper following standard ML/AI conference format (NeurIPS/ICML/ICLR style).

## Paper Structure

Write a complete paper with these sections:
1. **Title & Abstract** — Concise, informative, highlighting the key contribution
2. **Introduction** — Motivation, problem statement, contributions, paper organization
3. **Related Work** — Comprehensive review organized by theme
4. **Method** — Clear technical description with equations and diagrams (described in text)
5. **Experiments** — Setup, baselines, main results, ablations
6. **Analysis** — Deeper analysis of results, failure cases, insights
7. **Conclusion** — Summary, limitations, future work

## LaTeX Requirements

- Use standard article class with common packages: amsmath, amssymb, graphicx, booktabs, hyperref
- Use \\cite{} for citations with BibTeX keys matching the reference IDs
- Use proper LaTeX formatting: \\textbf{}, \\textit{}, \\emph{}
- Tables should use booktabs (\\toprule, \\midrule, \\bottomrule)
- Equations should be numbered and referenced
- Use \\label{} and \\ref{} for cross-references

## Citation Guidelines

- Cite all papers from the survey report that are relevant to each section
- Use the paper ID as the BibTeX key (e.g., \\cite{arxiv2401.12345})
- Cite at least 20 papers total
- Every claim about prior work must be cited

## Writing Style

- Clear, precise, and technical
- Active voice where appropriate
- Define all notation before use
- Explain the intuition behind technical choices
- Be honest about limitations

## Output Format

Output the complete LaTeX source as a single file. Start with:
\`\`\`latex
\\documentclass[10pt,twocolumn]{article}
...
\`\`\`

End with \\end{document}.

Also output a BibTeX file after the LaTeX:
\`\`\`bibtex
@article{key,
  title={...},
  author={...},
  year={...},
  ...
}
\`\`\`
`;
}

export function buildPaperWriterPrompt(state: ResearchState): string {
  const survey = state.surveyReport!;
  const results = state.experimentResults ?? [];
  const todo = state.todoList;

  const paperTitle = derivePaperTitle(survey.selectedIdea.title, survey.researchGoal);

  const resultsSection = results
    .map(
      (r) =>
        `### ${r.taskTitle}\n${r.summary}\n\nFindings:\n${r.findings.map((f) => `- ${f}`).join("\n")}${
          r.metrics
            ? `\n\nMetrics:\n${Object.entries(r.metrics)
                .map(([k, v]) => `- ${k}: ${v}`)
                .join("\n")}`
            : ""
        }`,
    )
    .join("\n\n---\n\n");

  const papersSection = survey.papers
    .map(
      (p) =>
        `- **${p.id}**: ${p.title} (${p.authors.slice(0, 3).join(", ")}, ${p.year})\n  ${p.abstract.slice(0, 200)}...`,
    )
    .join("\n\n");

  const refsBySection = Object.entries(survey.referencesBySection)
    .map(
      ([section, papers]) =>
        `**${section}:** ${papers.map((p) => p.id).join(", ")}`,
    )
    .join("\n");

  return `Please write a complete academic research paper based on the following research artifacts.

## Paper Title (suggested)
${paperTitle}

## Research Goal
${state.researchGoal}

## Selected Research Idea
**Title:** ${survey.selectedIdea.title}
**Description:** ${survey.selectedIdea.description}
**Novelty:** ${survey.selectedIdea.novelty}

## Key Contributions (from acceptance criteria)
${todo?.overallAcceptanceCriteria.map((ac) => `- ${ac.description}`).join("\n") ?? survey.selectedIdea.acceptanceCriteria.map((ac) => `- ${ac.description}`).join("\n")}

## Field Summary
${survey.fieldSummary}

## Open Problems Addressed
${survey.openProblems.map((p) => `- ${p}`).join("\n")}

## Experiment Results
${resultsSection || "Preliminary experiments conducted. See findings in survey."}

## Available References (${survey.papers.length} papers)
${papersSection}

## References by Section
${refsBySection}

Please write the complete LaTeX paper. Make it publication-quality with proper technical depth. Include all sections. Output the LaTeX source followed by the BibTeX file.`;
}

function derivePaperTitle(ideaTitle: string, researchGoal: string): string {
  // Simple heuristic: use the idea title if it's descriptive enough
  if (ideaTitle.length > 20 && ideaTitle.length < 100) {
    return ideaTitle;
  }
  // Otherwise derive from research goal
  return researchGoal.slice(0, 80);
}
