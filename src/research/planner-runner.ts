/**
 * ResearchClaw — Planner Runner
 *
 * Orchestrates the planner agent to generate or update the experiment todo list.
 * The planner reads the current research state and decides what to do next.
 */

import { randomBytes } from "node:crypto";
import path from "node:path";
import { runEmbeddedPiAgent } from "../agents/pi-embedded-runner/run.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import {
  buildInitialPlannerPrompt,
  buildIterativePlannerPrompt,
  buildPlannerAgentSystemPrompt,
  formatTodoListMarkdown,
} from "./prompts/planner-agent.js";
import { saveResearchState, writeTodoList } from "./state.js";
import type { ResearchState, TodoList } from "./types.js";

const log = createSubsystemLogger("research/planner");

export type PlannerRunnerParams = {
  state: ResearchState;
  workspaceDir: string;
  provider?: string;
  model?: string;
  /** Timeout in milliseconds for the planner agent (default: 10 minutes). */
  timeoutMs?: number;
  onPartialReply?: (text: string) => void;
};

export type PlannerRunnerResult = {
  ok: boolean;
  done?: boolean;
  doneReason?: string;
  todoList?: TodoList;
  error?: string;
};

/**
 * Run the planner agent to generate or update the experiment todo list.
 * Returns either a new/updated TodoList or a "done" signal.
 */
export async function runPlannerAgent(
  params: PlannerRunnerParams,
): Promise<PlannerRunnerResult> {
  const { state, workspaceDir } = params;
  const timeoutMs = params.timeoutMs ?? 10 * 60 * 1000; // 10 minutes

  const isInitialPlan = !state.todoList;
  log.info(
    isInitialPlan
      ? "Creating initial experiment plan..."
      : "Updating experiment plan based on results...",
  );

  await saveResearchState(workspaceDir, { ...state, status: "planning" });

  const sessionId = `research-planner-${randomBytes(4).toString("hex")}`;
  const sessionFile = path.join(workspaceDir, `${sessionId}.jsonl`);
  const runId = `planner-${randomBytes(4).toString("hex")}`;

  const systemPrompt = buildPlannerAgentSystemPrompt();
  const userPrompt = isInitialPlan
    ? buildInitialPlannerPrompt(state)
    : buildIterativePlannerPrompt(state);

  let fullOutput = "";

  try {
    const result = await runEmbeddedPiAgent({
      sessionId,
      sessionFile,
      workspaceDir,
      prompt: userPrompt,
      extraSystemPrompt: systemPrompt,
      provider: params.provider ?? "anthropic",
      model: params.model,
      timeoutMs,
      runId,
      onPartialReply: (payload) => {
        if (payload.text) {
          fullOutput += payload.text;
          params.onPartialReply?.(payload.text);
        }
      },
    });

    const payloadText = result.payloads
      ?.map((p) => p.text ?? "")
      .filter(Boolean)
      .join("\n")
      .trim();

    const agentOutput = payloadText || fullOutput;

    if (!agentOutput) {
      return { ok: false, error: "Planner agent produced no output." };
    }

    // Check for "done" signal
    const doneSignal = extractDoneSignal(agentOutput);
    if (doneSignal) {
      log.info(`Planner signals completion: ${doneSignal.reason}`);
      return { ok: true, done: true, doneReason: doneSignal.reason };
    }

    // Extract todo list
    const todoList = extractTodoList(agentOutput);
    if (!todoList) {
      return {
        ok: false,
        error: "Could not parse todo list JSON from planner output.",
      };
    }

    // Persist the todo list as markdown
    const markdown = formatTodoListMarkdown(todoList);
    await writeTodoList(workspaceDir, markdown);

    log.info(
      `Plan created/updated: ${todoList.tasks.length} tasks (${todoList.tasks.filter((t) => t.status === "pending").length} pending)`,
    );

    return { ok: true, todoList };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Planner agent failed: ${message}`);
    return { ok: false, error: message };
  }
}

type DoneSignal = { done: true; reason: string };

function extractDoneSignal(text: string): DoneSignal | undefined {
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/g);
  if (jsonBlockMatch) {
    for (const block of jsonBlockMatch) {
      const inner = block.replace(/```json\s*/, "").replace(/```$/, "").trim();
      try {
        const parsed = JSON.parse(inner);
        if (parsed.done === true && typeof parsed.reason === "string") {
          return parsed as DoneSignal;
        }
      } catch {
        // continue
      }
    }
  }

  // Try raw JSON
  const rawMatch = text.match(/\{"done"\s*:\s*true[\s\S]*?\}/);
  if (rawMatch) {
    try {
      const parsed = JSON.parse(rawMatch[0]);
      if (parsed.done === true) {
        return parsed as DoneSignal;
      }
    } catch {
      // continue
    }
  }

  return undefined;
}

function extractTodoList(text: string): TodoList | undefined {
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/g);
  if (jsonBlockMatch) {
    for (const block of jsonBlockMatch) {
      const inner = block.replace(/```json\s*/, "").replace(/```$/, "").trim();
      try {
        const parsed = JSON.parse(inner);
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          return parsed as TodoList;
        }
      } catch {
        // continue
      }
    }
  }

  // Try to find raw JSON with tasks array
  const rawMatch = text.match(/\{[\s\S]*"tasks"\s*:\s*\[[\s\S]*\]/);
  if (rawMatch) {
    try {
      const parsed = JSON.parse(rawMatch[0] + "}");
      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        return parsed as TodoList;
      }
    } catch {
      // continue
    }
  }

  return undefined;
}
