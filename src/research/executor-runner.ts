/**
 * ResearchClaw — Executor Runner
 *
 * Orchestrates the executor agent to run a single experiment task.
 * The executor has full access to bash tools, Python, and the file system.
 */

import { randomBytes } from "node:crypto";
import path from "node:path";
import { runEmbeddedPiAgent } from "../agents/pi-embedded-runner/run.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import {
  buildExecutorAgentSystemPrompt,
  buildExecutorTaskPrompt,
} from "./prompts/executor-agent.js";
import { saveResearchState, writeResultFile } from "./state.js";
import type { ExperimentResult, ResearchState, TodoTask } from "./types.js";

const log = createSubsystemLogger("research/executor");

export type ExecutorRunnerParams = {
  task: TodoTask;
  state: ResearchState;
  workspaceDir: string;
  provider?: string;
  model?: string;
  /** Timeout in milliseconds for the executor agent (default: 45 minutes). */
  timeoutMs?: number;
  onPartialReply?: (text: string) => void;
};

export type ExecutorRunnerResult = {
  ok: boolean;
  experimentResult?: ExperimentResult;
  taskStatus: "done" | "failed";
  error?: string;
};

/**
 * Run the executor agent to complete a single experiment task.
 * The executor writes code, runs experiments, and produces a structured result.
 */
export async function runExecutorAgent(
  params: ExecutorRunnerParams,
): Promise<ExecutorRunnerResult> {
  const { task, state, workspaceDir } = params;
  const timeoutMs = params.timeoutMs ?? 45 * 60 * 1000; // 45 minutes

  log.info(`Executing task: "${task.title}" (${task.id})`);

  // Mark task as in_progress
  const updatedTodo = state.todoList
    ? {
        ...state.todoList,
        tasks: state.todoList.tasks.map((t) =>
          t.id === task.id ? { ...t, status: "in_progress" as const } : t,
        ),
        updatedAt: new Date().toISOString(),
      }
    : undefined;

  await saveResearchState(workspaceDir, {
    ...state,
    status: "executing",
    todoList: updatedTodo,
  });

  const sessionId = `research-executor-${task.id}-${randomBytes(4).toString("hex")}`;
  const sessionFile = path.join(workspaceDir, `${sessionId}.jsonl`);
  const runId = `executor-${randomBytes(4).toString("hex")}`;

  const systemPrompt = buildExecutorAgentSystemPrompt();
  const userPrompt = buildExecutorTaskPrompt(task, state);

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
      return {
        ok: false,
        taskStatus: "failed",
        error: "Executor agent produced no output.",
      };
    }

    // Extract structured result from agent output
    const structuredResult = extractExecutorResult(agentOutput);

    // Build experiment result
    const resultContent = buildResultMarkdown(task, agentOutput, structuredResult);
    const resultFile = await writeResultFile(workspaceDir, task.id, resultContent);

    const experimentResult: ExperimentResult = {
      taskId: task.id,
      taskTitle: task.title,
      summary: structuredResult?.summary ?? extractSummary(agentOutput),
      findings: structuredResult?.findings ?? extractFindings(agentOutput),
      metrics: structuredResult?.metrics,
      resultFile,
      completedAt: new Date().toISOString(),
    };

    const taskStatus = structuredResult?.status === "failed" ? "failed" : "done";

    log.info(
      `Task ${task.id} ${taskStatus}: ${experimentResult.summary.slice(0, 100)}...`,
    );

    return { ok: true, experimentResult, taskStatus };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Executor agent failed for task ${task.id}: ${message}`);

    // Write failure result
    const resultContent = `# Task Failed: ${task.title}\n\n**Error:** ${message}\n\n**Task Description:**\n${task.description}`;
    const resultFile = await writeResultFile(workspaceDir, task.id, resultContent);

    const experimentResult: ExperimentResult = {
      taskId: task.id,
      taskTitle: task.title,
      summary: `Task failed: ${message}`,
      findings: [`Failure: ${message}`],
      resultFile,
      completedAt: new Date().toISOString(),
    };

    return { ok: false, experimentResult, taskStatus: "failed", error: message };
  }
}

type StructuredExecutorResult = {
  taskId: string;
  taskTitle: string;
  summary: string;
  findings: string[];
  metrics?: Record<string, string | number>;
  status: "done" | "failed";
  notes?: string;
};

function extractExecutorResult(text: string): StructuredExecutorResult | undefined {
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/g);
  if (jsonBlockMatch) {
    for (const block of jsonBlockMatch) {
      const inner = block.replace(/```json\s*/, "").replace(/```$/, "").trim();
      try {
        const parsed = JSON.parse(inner);
        if (parsed.summary && parsed.findings && Array.isArray(parsed.findings)) {
          return parsed as StructuredExecutorResult;
        }
      } catch {
        // continue
      }
    }
  }

  // Try raw JSON
  const rawMatch = text.match(/\{[\s\S]*"summary"[\s\S]*"findings"[\s\S]*\}/);
  if (rawMatch) {
    try {
      const parsed = JSON.parse(rawMatch[0]);
      if (parsed.summary && parsed.findings) {
        return parsed as StructuredExecutorResult;
      }
    } catch {
      // continue
    }
  }

  return undefined;
}

function extractSummary(text: string): string {
  // Try to find a summary section
  const summaryMatch = text.match(/##\s*Summary\s*\n+([\s\S]*?)(?=\n##|\n```|$)/i);
  if (summaryMatch) {
    return summaryMatch[1].trim().slice(0, 500);
  }
  // Fall back to first paragraph
  const firstPara = text.trim().split("\n\n")[0];
  return firstPara.slice(0, 300);
}

function extractFindings(text: string): string[] {
  // Try to find a findings section
  const findingsMatch = text.match(/##\s*(?:Findings|Results|Key Findings)\s*\n+([\s\S]*?)(?=\n##|$)/i);
  if (findingsMatch) {
    const lines = findingsMatch[1]
      .split("\n")
      .map((l) => l.replace(/^[-*]\s*/, "").trim())
      .filter((l) => l.length > 0);
    return lines.slice(0, 10);
  }
  return ["Experiment completed. See result file for details."];
}

function buildResultMarkdown(
  task: TodoTask,
  rawOutput: string,
  structured?: StructuredExecutorResult,
): string {
  const lines: string[] = [
    `# Experiment Result: ${task.title}`,
    "",
    `**Task ID:** ${task.id}`,
    `**Completed:** ${new Date().toISOString()}`,
    `**Status:** ${structured?.status ?? "done"}`,
    "",
  ];

  if (structured) {
    lines.push("## Summary", "", structured.summary, "");
    lines.push("## Findings", "");
    for (const finding of structured.findings) {
      lines.push(`- ${finding}`);
    }
    lines.push("");
    if (structured.metrics) {
      lines.push("## Metrics", "");
      for (const [key, value] of Object.entries(structured.metrics)) {
        lines.push(`- **${key}:** ${value}`);
      }
      lines.push("");
    }
    if (structured.notes) {
      lines.push("## Notes for Planner", "", structured.notes, "");
    }
  }

  lines.push("## Raw Agent Output", "", "```", rawOutput.slice(0, 10000), "```", "");

  return lines.join("\n");
}
