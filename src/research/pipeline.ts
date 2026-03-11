/**
 * ResearchClaw — Research Pipeline Orchestrator
 *
 * Coordinates the full research pipeline:
 * 1. Survey (literature review + idea selection)
 * 2. Planning (initial todo list)
 * 3. Execution loop (planner → executor → planner → ...)
 * 4. Paper writing trigger
 *
 * The pipeline persists state to disk at every step, enabling resumption
 * after interruption.
 */

import { createSubsystemLogger } from "../logging/subsystem.js";
import { runExecutorAgent } from "./executor-runner.js";
import { runPlannerAgent } from "./planner-runner.js";
import {
  createInitialState,
  ensureWorkspaceDirs,
  loadResearchState,
  saveResearchState,
} from "./state.js";
import { runSurveyAgent } from "./survey-runner.js";
import type { ExperimentResult, ResearchState, TodoTask } from "./types.js";

const log = createSubsystemLogger("research/pipeline");

/** Maximum number of planner-executor iterations before stopping. */
const MAX_ITERATIONS = 20;

export type PipelineParams = {
  researchGoal: string;
  workspaceDir: string;
  provider?: string;
  model?: string;
  /** Override timeouts for individual agents (ms). */
  surveyTimeoutMs?: number;
  plannerTimeoutMs?: number;
  executorTimeoutMs?: number;
  /** Callback for streaming output from agents. */
  onOutput?: (stage: string, text: string) => void;
  /** If true, skip the survey stage (use existing state). */
  skipSurvey?: boolean;
  /** If true, skip the planning/execution stage (go straight to writing). */
  skipExecution?: boolean;
};

export type PipelineResult = {
  ok: boolean;
  state?: ResearchState;
  error?: string;
  /** True if the pipeline completed all stages including paper writing. */
  complete?: boolean;
};

/**
 * Run the full research pipeline from goal to experiment results.
 * Paper writing is handled by a separate module (paper-writer).
 */
export async function runResearchPipeline(
  params: PipelineParams,
): Promise<PipelineResult> {
  const { researchGoal, workspaceDir } = params;

  log.info(`Starting research pipeline for: "${researchGoal}"`);
  log.info(`Workspace: ${workspaceDir}`);

  await ensureWorkspaceDirs(workspaceDir);

  // Load or create state
  let state = await loadResearchState(workspaceDir);
  if (!state) {
    state = createInitialState(researchGoal, workspaceDir);
    await saveResearchState(workspaceDir, state);
    log.info("Created new research state.");
  } else {
    log.info(`Resuming from status: ${state.status}`);
  }

  const onOutput = (stage: string, text: string) => {
    params.onOutput?.(stage, text);
    process.stdout.write(text);
  };

  // ─── Stage 1: Survey ─────────────────────────────────────────────────────
  if (!params.skipSurvey && !state.surveyReport) {
    log.info("=== Stage 1: Literature Survey ===");
    onOutput("survey", "\n📚 Starting literature survey...\n");

    const surveyResult = await runSurveyAgent({
      state,
      workspaceDir,
      provider: params.provider,
      model: params.model,
      timeoutMs: params.surveyTimeoutMs,
      onPartialReply: (text) => onOutput("survey", text),
    });

    if (!surveyResult.ok || !surveyResult.surveyReport) {
      return {
        ok: false,
        error: `Survey failed: ${surveyResult.error ?? "unknown error"}`,
      };
    }

    state = {
      ...state,
      surveyReport: surveyResult.surveyReport,
      status: "planning",
    };
    await saveResearchState(workspaceDir, state);
    log.info("Survey complete.");
    onOutput("survey", "\n✅ Survey complete.\n");
  } else if (state.surveyReport) {
    log.info("Survey already complete, skipping.");
  }

  if (params.skipExecution) {
    log.info("Skipping execution stage as requested.");
    return { ok: true, state };
  }

  // ─── Stage 2: Initial Planning ────────────────────────────────────────────
  if (!state.todoList) {
    log.info("=== Stage 2: Initial Planning ===");
    onOutput("planner", "\n🗂️ Creating experiment plan...\n");

    const planResult = await runPlannerAgent({
      state,
      workspaceDir,
      provider: params.provider,
      model: params.model,
      timeoutMs: params.plannerTimeoutMs,
      onPartialReply: (text) => onOutput("planner", text),
    });

    if (!planResult.ok || !planResult.todoList) {
      return {
        ok: false,
        error: `Planning failed: ${planResult.error ?? "unknown error"}`,
      };
    }

    state = {
      ...state,
      todoList: planResult.todoList,
      status: "executing",
    };
    await saveResearchState(workspaceDir, state);
    log.info(`Initial plan created: ${planResult.todoList.tasks.length} tasks.`);
    onOutput("planner", `\n✅ Plan created: ${planResult.todoList.tasks.length} tasks.\n`);
  }

  // ─── Stage 3: Planner/Executor Loop ──────────────────────────────────────
  log.info("=== Stage 3: Experiment Execution Loop ===");

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    log.info(`Iteration ${iteration + 1}/${MAX_ITERATIONS}`);

    // Find the next pending task
    const nextTask = state.todoList?.tasks.find((t) => t.status === "pending");
    if (!nextTask) {
      log.info("No pending tasks. Running planner to check if done or add more tasks.");
      onOutput("planner", "\n🗂️ Checking progress and updating plan...\n");

      const planResult = await runPlannerAgent({
        state,
        workspaceDir,
        provider: params.provider,
        model: params.model,
        timeoutMs: params.plannerTimeoutMs,
        onPartialReply: (text) => onOutput("planner", text),
      });

      if (!planResult.ok) {
        log.warn(`Planner failed: ${planResult.error}. Stopping.`);
        break;
      }

      if (planResult.done) {
        log.info(`Pipeline complete: ${planResult.doneReason}`);
        onOutput("pipeline", `\n🎉 Research complete: ${planResult.doneReason}\n`);
        state = { ...state, status: "writing" };
        await saveResearchState(workspaceDir, state);
        return { ok: true, state, complete: true };
      }

      if (planResult.todoList) {
        state = { ...state, todoList: planResult.todoList };
        await saveResearchState(workspaceDir, state);
      }

      continue;
    }

    // Execute the next task
    log.info(`Executing task: "${nextTask.title}"`);
    onOutput("executor", `\n🔬 Executing: ${nextTask.title}\n`);

    const execResult = await runExecutorAgent({
      task: nextTask,
      state,
      workspaceDir,
      provider: params.provider,
      model: params.model,
      timeoutMs: params.executorTimeoutMs,
      onPartialReply: (text) => onOutput("executor", text),
    });

    // Update state with task result
    const updatedTasks = state.todoList!.tasks.map((t) =>
      t.id === nextTask.id
        ? {
            ...t,
            status: execResult.taskStatus,
            result: execResult.experimentResult?.summary,
            resultFile: execResult.experimentResult?.resultFile,
            completedAt: new Date().toISOString(),
          }
        : t,
    );

    const updatedResults: ExperimentResult[] = [
      ...(state.experimentResults ?? []),
      ...(execResult.experimentResult ? [execResult.experimentResult] : []),
    ];

    state = {
      ...state,
      todoList: {
        ...state.todoList!,
        tasks: updatedTasks,
        updatedAt: new Date().toISOString(),
      },
      experimentResults: updatedResults,
    };
    await saveResearchState(workspaceDir, state);

    const statusIcon = execResult.taskStatus === "done" ? "✅" : "❌";
    onOutput(
      "executor",
      `\n${statusIcon} Task ${execResult.taskStatus}: ${nextTask.title}\n`,
    );
  }

  if (state.status !== "writing") {
    log.warn(`Pipeline stopped after ${MAX_ITERATIONS} iterations without completion.`);
    state = { ...state, status: "writing" };
    await saveResearchState(workspaceDir, state);
  }

  return { ok: true, state, complete: false };
}

/** Get the next pending task from the current state. */
export function getNextPendingTask(state: ResearchState): TodoTask | undefined {
  return state.todoList?.tasks.find((t) => t.status === "pending");
}

/** Check if all required acceptance criteria are met based on experiment results. */
export function checkAcceptanceCriteria(state: ResearchState): {
  met: boolean;
  summary: string;
} {
  const criteria = state.todoList?.overallAcceptanceCriteria ?? [];
  const results = state.experimentResults ?? [];

  if (criteria.length === 0) {
    return { met: false, summary: "No acceptance criteria defined." };
  }

  const resultText = results.map((r) => `${r.taskTitle}: ${r.summary}`).join("\n");

  // Simple heuristic: if we have results for most tasks, consider it potentially done
  const totalTasks = state.todoList?.tasks.length ?? 0;
  const doneTasks = state.todoList?.tasks.filter((t) => t.status === "done").length ?? 0;

  if (totalTasks > 0 && doneTasks / totalTasks >= 0.8) {
    return {
      met: true,
      summary: `${doneTasks}/${totalTasks} tasks completed. Results: ${resultText.slice(0, 200)}`,
    };
  }

  return {
    met: false,
    summary: `${doneTasks}/${totalTasks} tasks completed.`,
  };
}
