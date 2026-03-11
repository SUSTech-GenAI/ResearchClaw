/**
 * ResearchClaw — Planner Agent System Prompt
 *
 * The planner agent reads the current research state and produces
 * the next set of tasks to execute (or determines the work is done).
 */

import type { ResearchState, TodoList } from "../types.js";

export function buildPlannerAgentSystemPrompt(): string {
  return `You are ResearchClaw's Planner Agent — an expert research project manager who creates actionable experiment plans.

## Your Role

You receive the current research state (survey report, completed experiments, results) and decide what experiments to run next. You produce a structured JSON todo list.

## Planning Principles

1. **Start simple, iterate**: Begin with baseline experiments before complex ones
2. **Loose acceptance criteria**: Tasks should have clear goals but leave implementation details to the executor
3. **Incremental progress**: Each task should build on previous results
4. **Realistic scope**: Each task should be completable in a single agent session
5. **Adaptive**: Adjust plans based on what previous experiments revealed

## Task Design Guidelines

Each task should:
- Have a clear, specific title (e.g., "Implement baseline Transformer model")
- Include enough context for the executor to understand what to do
- Specify acceptance criteria at the level of "what success looks like", NOT "how to achieve it"
- Reference relevant papers or previous results when helpful

## Output Format

Output a valid JSON TodoList object:

\`\`\`json
{
  "researchGoal": "...",
  "selectedIdeaTitle": "...",
  "overallAcceptanceCriteria": [
    {
      "id": "ac-1",
      "description": "...",
      "metric": "...",
      "required": true
    }
  ],
  "tasks": [
    {
      "id": "task-1",
      "title": "Set up experiment environment and baseline",
      "description": "Install required packages, download datasets, and implement a simple baseline model to establish performance benchmarks.",
      "acceptanceCriteria": "Baseline model runs successfully and produces measurable results on the target dataset.",
      "status": "pending",
      "createdAt": "ISO timestamp"
    }
  ],
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
\`\`\`

## When Planning is Complete

If the overall acceptance criteria have been met based on experiment results, output:

\`\`\`json
{"done": true, "reason": "All acceptance criteria met: ..."}
\`\`\`
`;
}

export function buildInitialPlannerPrompt(state: ResearchState): string {
  const survey = state.surveyReport!;
  const idea = survey.selectedIdea;

  return `Please create an initial experiment plan for the following research:

## Research Goal
${state.researchGoal}

## Selected Research Idea
**Title:** ${idea.title}
**Description:** ${idea.description}
**Novelty:** ${idea.novelty}

## Overall Acceptance Criteria
${idea.acceptanceCriteria.map((ac) => `- ${ac.description}${ac.metric ? ` (${ac.metric})` : ""}`).join("\n")}

## Key Papers to Reference
${survey.papers
  .slice(0, 10)
  .map((p) => `- ${p.title} (${p.year}): ${p.annotation ?? p.abstract.slice(0, 100)}...`)
  .join("\n")}

Please create a practical experiment plan with 3-6 initial tasks. Start with environment setup and baseline experiments.`;
}

export function buildIterativePlannerPrompt(state: ResearchState): string {
  const survey = state.surveyReport!;
  const todo = state.todoList!;
  const results = state.experimentResults ?? [];

  const completedTasks = todo.tasks.filter((t) => t.status === "done");
  const failedTasks = todo.tasks.filter((t) => t.status === "failed");
  const pendingTasks = todo.tasks.filter((t) => t.status === "pending");

  const resultsSummary = results
    .map(
      (r) =>
        `### ${r.taskTitle}\n${r.summary}\n**Findings:** ${r.findings.join("; ")}${
          r.metrics
            ? `\n**Metrics:** ${Object.entries(r.metrics)
                .map(([k, v]) => `${k}=${v}`)
                .join(", ")}`
            : ""
        }`,
    )
    .join("\n\n");

  return `Please update the experiment plan based on current progress.

## Research Goal
${state.researchGoal}

## Selected Idea: ${survey.selectedIdea.title}

## Overall Acceptance Criteria
${todo.overallAcceptanceCriteria.map((ac) => `- [${ac.required ? "REQUIRED" : "optional"}] ${ac.description}${ac.metric ? ` (${ac.metric})` : ""}`).join("\n")}

## Progress Summary
- Completed tasks: ${completedTasks.length}
- Failed tasks: ${failedTasks.length}
- Pending tasks: ${pendingTasks.length}

## Experiment Results So Far
${resultsSummary || "No results yet."}

## Failed Tasks (need retry or alternative approach)
${failedTasks.map((t) => `- ${t.title}: ${t.result ?? "no details"}`).join("\n") || "None"}

## Currently Pending Tasks
${pendingTasks.map((t) => `- ${t.id}: ${t.title}`).join("\n") || "None"}

Based on the results above, decide:
1. If the acceptance criteria are met → output \`{"done": true, "reason": "..."}\`
2. If more experiments are needed → output an updated TodoList with new/revised tasks

Keep pending tasks that are still relevant. Add new tasks based on findings. Remove tasks that are no longer necessary.`;
}

export function formatTodoListMarkdown(todo: TodoList): string {
  const lines: string[] = [
    `# Experiment Plan: ${todo.selectedIdeaTitle}`,
    "",
    `**Research Goal:** ${todo.researchGoal}`,
    `**Updated:** ${todo.updatedAt}`,
    "",
    "## Overall Acceptance Criteria",
    "",
    ...todo.overallAcceptanceCriteria.map(
      (ac) =>
        `- [${ac.required ? "required" : "optional"}] **${ac.id}**: ${ac.description}${ac.metric ? ` — ${ac.metric}` : ""}`,
    ),
    "",
    "## Tasks",
    "",
  ];

  for (const task of todo.tasks) {
    const statusIcon =
      task.status === "done"
        ? "✅"
        : task.status === "failed"
          ? "❌"
          : task.status === "in_progress"
            ? "🔄"
            : "⬜";
    lines.push(`### ${statusIcon} ${task.id}: ${task.title}`);
    lines.push("");
    lines.push(task.description);
    lines.push("");
    lines.push(`**Acceptance Criteria:** ${task.acceptanceCriteria}`);
    lines.push(`**Status:** ${task.status}`);
    if (task.result) {
      lines.push(`**Result:** ${task.result}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
