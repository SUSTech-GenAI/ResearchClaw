# Introduction

Large language model (LLM)–based agents have recently advanced to handle complex tasks that require long-term planning, reasoning, and dynamic tool use. Despite this progress, these systems still exhibit inconsistent reliability: they often fail silently or produce incorrect intermediate outputs without realizing it. Prior research indicates that *self-reflection* mechanisms—where an agent critiques and improves its own reasoning—can reduce such errors, but empirical understanding of their effect on real task completion remains limited.

The concept of self-reflection originates from cognitive science as *meta-cognition*, i.e., thinking about one’s own thinking. In LLMs, this translates to an explicit reasoning review loop: after generating an initial plan or response, the model reflects on potential flaws, revises its decision, and verifies the correction. Several frameworks, such as PALADIN \cite{vuddanti2025}, SuperCorrect \cite{yang2024}, and Reflection-Reinforced Self-Training \cite{dou2024}, hint that reflective reasoning improves model robustness. However, most prior work reports qualitative outcomes or case studies rather than systematic, quantitative evaluations.

**Research Gap.** Existing literature lacks controlled, quantitative analysis mapping *reflection depth* to *task completion rate* across diverse benchmarks. Furthermore, the cost associated with additional reflecting steps has seldom been characterized, leaving open the question of how to balance improvement against computational overhead.

**Research Objective.** This study investigates how structured self-reflection affects LLM agent performance. We construct agents with three levels of reflective capability: no reflection, single-pass reflection, and multi-pass reflection, plus an adaptive controller adjusting depth based on confidence.

**Contributions.**
1. We implement a unified reflection-enabled agent framework compatible with Llama3-8B and Mistral-7B backends.  
2. We empirically quantify how reflection depth impacts overall task completion rates, showing +12% improvement at depth=2.  
3. We propose an adaptive reflection strategy that achieves near-parity performance with significantly reduced compute cost (–33%).  
4. We provide a reproducible experimental setup including prompt scripts and metrics for community validation.

The remainder of this paper is organized as follows: we review related work (§2), describe the reflection methodology (§3), present empirical results (§4), and discuss implications and future directions (§5).