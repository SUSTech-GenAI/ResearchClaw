/**
 * ResearchClaw — Survey Runner
 *
 * Orchestrates the survey agent to perform agentic literature review.
 * Calls runEmbeddedPiAgent with the survey system prompt and extracts
 * the structured SurveyReport from the agent's output.
 */

import { randomBytes } from "node:crypto";
import path from "node:path";
import { runEmbeddedPiAgent } from "../agents/pi-embedded-runner/run.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { buildSurveyAgentPrompt, buildSurveyAgentSystemPrompt } from "./prompts/survey-agent.js";
import {
  ensureWorkspaceDirs,
  saveResearchState,
  writeSurveyReport,
} from "./state.js";
import type { ResearchState, SurveyReport } from "./types.js";

const log = createSubsystemLogger("research/survey");

export type SurveyRunnerParams = {
  state: ResearchState;
  workspaceDir: string;
  provider?: string;
  model?: string;
  /** Timeout in milliseconds for the survey agent (default: 30 minutes). */
  timeoutMs?: number;
  /** Callback for streaming partial output. */
  onPartialReply?: (text: string) => void;
};

export type SurveyRunnerResult = {
  ok: boolean;
  surveyReport?: SurveyReport;
  error?: string;
};

/**
 * Run the survey agent to produce a structured literature review report.
 * The agent uses web search and PDF tools to collect papers and generate ideas.
 */
export async function runSurveyAgent(
  params: SurveyRunnerParams,
): Promise<SurveyRunnerResult> {
  const { state, workspaceDir } = params;
  const timeoutMs = params.timeoutMs ?? 30 * 60 * 1000; // 30 minutes

  log.info(`Starting survey for: "${state.researchGoal}"`);

  await ensureWorkspaceDirs(workspaceDir);

  // Update state to surveying
  await saveResearchState(workspaceDir, { ...state, status: "surveying" });

  const sessionId = `research-survey-${randomBytes(4).toString("hex")}`;
  const sessionFile = path.join(workspaceDir, `${sessionId}.jsonl`);
  const runId = `survey-${randomBytes(4).toString("hex")}`;

  const systemPrompt = buildSurveyAgentSystemPrompt();
  const userPrompt = buildSurveyAgentPrompt(state.researchGoal);

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

    // Collect all text from payloads
    const payloadText = result.payloads
      ?.map((p) => p.text ?? "")
      .filter(Boolean)
      .join("\n")
      .trim();

    const agentOutput = payloadText || fullOutput;

    if (!agentOutput) {
      return { ok: false, error: "Survey agent produced no output." };
    }

    // Extract JSON from the agent output
    const surveyReport = extractSurveyReport(agentOutput);
    if (!surveyReport) {
      log.warn("Failed to extract survey report JSON from agent output.");
      // Save raw output for debugging
      await writeSurveyReport(workspaceDir, agentOutput);
      return {
        ok: false,
        error: "Could not parse survey report JSON from agent output. Raw output saved to survey-report.md.",
      };
    }

    // Persist the survey report as markdown
    const reportMarkdown = formatSurveyReportMarkdown(surveyReport);
    await writeSurveyReport(workspaceDir, reportMarkdown);

    log.info(
      `Survey complete: ${surveyReport.papers.length} papers, ${surveyReport.ideas.length} ideas, selected: "${surveyReport.selectedIdea.title}"`,
    );

    return { ok: true, surveyReport };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Survey agent failed: ${message}`);
    return { ok: false, error: message };
  }
}

/** Extract the SurveyReport JSON from agent output text. */
function extractSurveyReport(text: string): SurveyReport | undefined {
  // Try to find a JSON code block first
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    try {
      return JSON.parse(jsonBlockMatch[1].trim()) as SurveyReport;
    } catch {
      // Fall through to direct parse
    }
  }

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*"researchGoal"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]) as SurveyReport;
    } catch {
      // Fall through
    }
  }

  return undefined;
}

/** Format the survey report as a readable markdown document. */
function formatSurveyReportMarkdown(report: SurveyReport): string {
  const lines: string[] = [
    `# Survey Report: ${report.researchGoal}`,
    "",
    `**Completed:** ${report.completedAt}`,
    "",
    "## Field Summary",
    "",
    report.fieldSummary,
    "",
    "## Open Problems",
    "",
    ...report.openProblems.map((p) => `- ${p}`),
    "",
    "## Research Ideas",
    "",
  ];

  for (const idea of report.ideas) {
    lines.push(`### ${idea.title}`);
    lines.push("");
    lines.push(idea.description);
    lines.push("");
    lines.push(`**Novelty:** ${idea.novelty}`);
    lines.push(`**Difficulty:** ${idea.difficulty}`);
    lines.push(`**Potential Impact:** ${idea.potentialImpact}`);
    lines.push("");
  }

  lines.push("## Selected Idea");
  lines.push("");
  lines.push(`### ${report.selectedIdea.title}`);
  lines.push("");
  lines.push(report.selectedIdea.description);
  lines.push("");
  lines.push("### Acceptance Criteria");
  lines.push("");
  for (const ac of report.selectedIdea.acceptanceCriteria) {
    const required = ac.required ? "(required)" : "(optional)";
    lines.push(`- **${ac.id}** ${required}: ${ac.description}`);
    if (ac.metric) {
      lines.push(`  - Metric: ${ac.metric}`);
    }
  }
  lines.push("");

  lines.push("## Papers Collected");
  lines.push("");
  lines.push(`Total: ${report.papers.length} papers`);
  lines.push("");

  for (const paper of report.papers) {
    lines.push(`### ${paper.title}`);
    lines.push(`- **Authors:** ${paper.authors.join(", ")}`);
    lines.push(`- **Year:** ${paper.year}`);
    lines.push(`- **Source:** ${paper.source}`);
    lines.push(`- **URL:** ${paper.url}`);
    if (paper.annotation) {
      lines.push(`- **Annotation:** ${paper.annotation}`);
    }
    lines.push("");
  }

  lines.push("## References by Section");
  lines.push("");
  for (const [section, papers] of Object.entries(report.referencesBySection)) {
    lines.push(`### ${section}`);
    lines.push("");
    for (const paper of papers) {
      lines.push(`- [${paper.title}](${paper.url}) (${paper.year})`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
