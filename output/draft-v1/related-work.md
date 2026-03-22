# Related Work

### Self-Reflection in LLM Agents
Renze and Guven (2024) demonstrated that LLMs equipped with a self-review step improve problem-solving accuracy. Chen et al. (2025) extended this by using synthetic self-reflections during training, highlighting that exposing models to reconstructed reasoning paths enhances generalization. Yang et al. (2024) proposed SuperCorrect, which distilled reflection templates for small models, showing a 25–40% improvement in reasoning correctness.

### Self-Correction and Tool Failure Recovery
Vuddanti et al. (2025) introduced PALADIN, a self-correcting agent capable of repairing tool-failure states. They found substantial robustness gains, aligning with our goal of improving end-to-end task completion. Dou et al. (2024) embedded reflective feedback within self-training loops, showing faster convergence.

### Reinforcement and Critic-Based Reflection
Xiang et al. (2025) integrated offline reinforcement learning critics to evaluate past decision trajectories (“Retrospex”). Liang et al. (2025) showed that self-awareness–driven problem synthesis can automatically adjust reasoning deficits, indicating reflection as a bridge between symbolic reasoning and meta-learning.

### Gaps and Positioning
Despite growing evidence linking reflection to improved reasoning, prior works typically focus on accuracy or reasoning benchmarks rather than direct task completion—the central metric of agency. Few studies quantify *how much reflection matters* or *when it saturates*. To our knowledge, this study provides the first quantitative mapping of reflection depth versus completion rate, along with analysis of efficiency tradeoffs, using open-weight reproducible LLM agents.