"""Survey pipeline — structured literature search before the research loop."""

from __future__ import annotations

import json
from pathlib import Path

from .llm import chat
from .tools import search_papers, fetch_arxiv

DEFAULT_MODEL = "gpt-5-chat"


def run_survey(idea: str, project_dir: Path, model: str = DEFAULT_MODEL) -> str:
    """Run a 3-step survey pipeline: generate queries → search → synthesize.

    Outputs:
      - literature/survey-report.md
      - literature/paper-list.md

    Returns the survey report text.
    """
    project_dir = project_dir.resolve()
    lit_dir = project_dir / "literature"
    lit_dir.mkdir(parents=True, exist_ok=True)

    print("[survey] Phase 1: Generating search queries...")
    queries = _generate_queries(idea, model)
    print(f"[survey] Generated {len(queries)} queries: {queries}")

    print("[survey] Phase 2: Searching papers...")
    papers_text = _search_all(queries)
    paper_list_path = lit_dir / "paper-list.md"
    paper_list_path.write_text(f"# Paper Search Results\n\nIdea: {idea}\n\n{papers_text}\n")
    print(f"[survey] Saved paper list to {paper_list_path}")

    print("[survey] Phase 3: Synthesizing survey report...")
    report = _synthesize(idea, papers_text, model)
    report_path = lit_dir / "survey-report.md"
    report_path.write_text(report)
    print(f"[survey] Saved survey report to {report_path}")

    return report


def _generate_queries(idea: str, model: str) -> list[str]:
    """Use LLM to turn a research idea into 3-5 academic search queries."""
    resp = chat(
        [
            {
                "role": "system",
                "content": (
                    "You are a research assistant. Given a research idea, generate 3-5 "
                    "academic search queries that would find the most relevant papers. "
                    "Output ONLY a JSON array of strings, no other text."
                ),
            },
            {"role": "user", "content": idea},
        ],
        model=model,
        temperature=0.3,
        max_tokens=500,
    )
    text = (resp.choices[0].message.content or "").strip()
    # Extract JSON array from response
    try:
        # Handle cases where model wraps in markdown code block
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()
        queries = json.loads(text)
        if isinstance(queries, list) and all(isinstance(q, str) for q in queries):
            return queries[:5]
    except (json.JSONDecodeError, IndexError):
        pass
    # Fallback: split by lines
    fallback = [line.strip().strip('"').strip("'") for line in text.splitlines() if line.strip()]
    return fallback[:5] if fallback else [idea]


def _search_all(queries: list[str]) -> str:
    """Search both Semantic Scholar and arXiv for each query, combine results."""
    all_results: list[str] = []
    seen_titles: set[str] = set()

    for q in queries:
        all_results.append(f"## Query: {q}\n")

        # Semantic Scholar
        ss_result = search_papers(q, limit=8)
        all_results.append(f"### Semantic Scholar\n{ss_result}\n")

        # arXiv
        arxiv_result = fetch_arxiv(q, max_results=5)
        all_results.append(f"### arXiv\n{arxiv_result}\n")

    return "\n".join(all_results)


def _synthesize(idea: str, papers_text: str, model: str) -> str:
    """Use LLM to synthesize a structured survey report from search results."""
    # Truncate papers_text if too long for context
    if len(papers_text) > 30_000:
        papers_text = papers_text[:30_000] + "\n\n... (truncated)"

    resp = chat(
        [
            {
                "role": "system",
                "content": (
                    "You are a research survey writer. Based on paper search results, "
                    "write a structured survey report in markdown. Be thorough and analytical."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"# Research Idea\n\n{idea}\n\n"
                    f"# Paper Search Results\n\n{papers_text}\n\n"
                    "---\n\n"
                    "Please write a structured survey report with these sections:\n\n"
                    "## 1. Research Landscape Overview\n"
                    "Summarize the current state of research in this area.\n\n"
                    "## 2. Key Papers and Approaches\n"
                    "Describe the most relevant papers, their methods, and findings.\n\n"
                    "## 3. Identified Research Gaps\n"
                    "What hasn't been explored? Where are the opportunities?\n\n"
                    "## 4. Suggested Research Direction\n"
                    "Based on the gaps, how should the original idea be refined or adjusted?\n\n"
                    "## 5. Potential Baselines and Methods\n"
                    "What existing methods could serve as baselines or starting points?\n\n"
                    "## 6. Key References\n"
                    "List the most important papers to read in detail.\n"
                ),
            },
        ],
        model=model,
        temperature=0.5,
        max_tokens=4096,
    )
    return resp.choices[0].message.content or "(empty survey report)"
