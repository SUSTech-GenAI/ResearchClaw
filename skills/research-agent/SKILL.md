---
name: research-agent
description: Agentic academic research skill for ResearchClaw — enables deep literature survey, idea generation, and experiment planning for ML/AI research.
version: 1.0.0
---

# Research Agent Skill

This skill provides the ResearchClaw research agent with specialized capabilities for academic research.

## Capabilities

### Literature Search
- Search arXiv for recent papers using the web search tool
- Use queries like: `site:arxiv.org <topic> 2024 2025`
- Fetch paper abstracts and key sections via web fetch
- Semantic Scholar API: `https://api.semanticscholar.org/graph/v1/paper/search?query=<topic>&fields=title,authors,year,abstract,url`

### Paper Analysis
- Extract key contributions, methods, and results from papers
- Identify limitations and open problems
- Map relationships between papers

### Idea Generation
- Generate novel research ideas based on identified gaps
- Assess feasibility and potential impact
- Select the most promising idea with clear acceptance criteria

### Experiment Planning
- Break down research into concrete, executable tasks
- Define loose acceptance criteria that leave room for exploration
- Adapt plans based on experimental results

## Search Strategies

For a research goal like "video large models for paper":
1. Search: `video large language models 2024 arxiv`
2. Search: `video understanding multimodal models benchmark 2024`
3. Search: `video generation diffusion transformer 2025`
4. Search: `video LLM evaluation metrics 2024`
5. Fetch top papers and extract key information

## Output Format

Always output a structured JSON survey report as specified in the system prompt.
Include at least 20 papers, 3-5 ideas, and clear acceptance criteria for the selected idea.
