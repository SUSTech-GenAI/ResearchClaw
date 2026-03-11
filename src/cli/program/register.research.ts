/**
 * ResearchClaw — CLI Research Command Registration
 *
 * Registers the `research`, `write`, and `status` commands
 * into the OpenClaw CLI program.
 */

import type { Command } from "commander";
import path from "node:path";
import { runResearchPipeline } from "../../research/pipeline.js";
import { runPaperWriter } from "../../research/paper-writer.js";
import { loadResearchState } from "../../research/state.js";

export function registerResearchCommands(program: Command): void {
  // ─── research command ───────────────────────────────────────────────────
  program
    .command("research <goal>")
    .description(
      "Start or resume an agentic research pipeline from a natural language goal",
    )
    .option(
      "-w, --workspace <dir>",
      "Workspace directory for storing all research artifacts",
      "./research-workspace",
    )
    .option(
      "--provider <provider>",
      "LLM provider (anthropic, openai, google, openrouter, groq)",
      "anthropic",
    )
    .option("--model <model>", "Model ID (default: provider's best model)")
    .option("--skip-survey", "Skip the survey stage (use existing state)", false)
    .option("--skip-execution", "Skip execution (survey only)", false)
    .option("--survey-timeout <minutes>", "Survey agent timeout in minutes", "30")
    .option("--planner-timeout <minutes>", "Planner agent timeout in minutes", "10")
    .option("--executor-timeout <minutes>", "Executor agent timeout in minutes", "45")
    .action(async (goal: string, opts) => {
      checkApiKey(opts.provider ?? "anthropic");

      const workspaceDir = path.resolve(opts.workspace);

      console.log(`\n🔬 ResearchClaw — Starting Research Pipeline`);
      console.log(`📁 Workspace: ${workspaceDir}`);
      console.log(`🎯 Goal: ${goal}`);
      console.log(`🤖 Provider: ${opts.provider ?? "anthropic"}/${opts.model ?? "default"}\n`);

      const result = await runResearchPipeline({
        researchGoal: goal,
        workspaceDir,
        provider: opts.provider,
        model: opts.model,
        skipSurvey: opts.skipSurvey,
        skipExecution: opts.skipExecution,
        surveyTimeoutMs: parseInt(opts.surveyTimeout) * 60 * 1000,
        plannerTimeoutMs: parseInt(opts.plannerTimeout) * 60 * 1000,
        executorTimeoutMs: parseInt(opts.executorTimeout) * 60 * 1000,
      });

      if (!result.ok) {
        console.error(`\n❌ Pipeline failed: ${result.error}`);
        process.exit(1);
      }

      const state = result.state!;
      console.log(`\n✅ Pipeline complete. Status: ${state.status}`);
      console.log(`📁 Results saved to: ${workspaceDir}`);

      if (result.complete) {
        console.log("\n🎉 All acceptance criteria met!");
        console.log(
          `\nRun: openclaw write "${workspaceDir}" to generate the paper.`,
        );
      } else {
        const doneTasks =
          state.todoList?.tasks.filter((t) => t.status === "done").length ?? 0;
        const totalTasks = state.todoList?.tasks.length ?? 0;
        console.log(`\n📊 Progress: ${doneTasks}/${totalTasks} tasks completed`);
        console.log(`\nTo write the paper based on current results:`);
        console.log(`  openclaw write "${workspaceDir}"`);
      }
    });

  // ─── write command ──────────────────────────────────────────────────────
  program
    .command("write <workspace>")
    .description("Write a research paper based on completed experiment results")
    .option("--provider <provider>", "LLM provider", "anthropic")
    .option("--model <model>", "Model ID")
    .option("--no-pdf", "Skip PDF compilation (output LaTeX only)", false)
    .option("--timeout <minutes>", "Paper writer timeout in minutes", "30")
    .action(async (workspace: string, opts) => {
      checkApiKey(opts.provider ?? "anthropic");

      const workspaceDir = path.resolve(workspace);
      const state = await loadResearchState(workspaceDir);

      if (!state) {
        console.error(`❌ No research state found in: ${workspaceDir}`);
        console.error(`Run "openclaw research <goal>" first.`);
        process.exit(1);
      }

      if (!state.surveyReport) {
        console.error(`❌ Survey not complete. Run "openclaw research" first.`);
        process.exit(1);
      }

      console.log(`\n✍️  ResearchClaw — Writing Paper`);
      console.log(`📁 Workspace: ${workspaceDir}`);
      console.log(`📄 Research: ${state.researchGoal}\n`);

      const result = await runPaperWriter({
        state,
        workspaceDir,
        provider: opts.provider,
        model: opts.model,
        compilePdf: !opts.noPdf,
        timeoutMs: parseInt(opts.timeout) * 60 * 1000,
        onPartialReply: (text) => process.stdout.write(text),
      });

      if (!result.ok) {
        console.error(`\n❌ Paper writing failed: ${result.error}`);
        process.exit(1);
      }

      const draft = result.paperDraft!;
      console.log(`\n✅ Paper written: "${draft.title}"`);
      console.log(`📄 LaTeX: ${draft.latexFile}`);
      if (draft.pdfFile) {
        console.log(`📑 PDF: ${draft.pdfFile}`);
      } else {
        console.log(
          `⚠️  PDF compilation skipped or failed. See ${workspaceDir}/paper/ for LaTeX.`,
        );
        console.log(`   Install TeX Live and run: cd ${workspaceDir}/paper && pdflatex paper.tex`);
      }
    });

  // ─── research-status command ────────────────────────────────────────────
  program
    .command("research-status <workspace>")
    .description("Show the current status of a research pipeline")
    .action(async (workspace: string) => {
      const workspaceDir = path.resolve(workspace);
      const state = await loadResearchState(workspaceDir);

      if (!state) {
        console.log(`No research state found in: ${workspaceDir}`);
        return;
      }

      console.log(`\n📊 Research Pipeline Status`);
      console.log(`─────────────────────────────`);
      console.log(`Goal:    ${state.researchGoal}`);
      console.log(`Status:  ${state.status}`);
      console.log(`Updated: ${state.updatedAt}`);

      if (state.surveyReport) {
        const survey = state.surveyReport;
        console.log(`\n📚 Survey`);
        console.log(`  Papers: ${survey.papers.length}`);
        console.log(`  Ideas:  ${survey.ideas.length}`);
        console.log(`  Selected: ${survey.selectedIdea.title}`);
      }

      if (state.todoList) {
        const todo = state.todoList;
        const done = todo.tasks.filter((t) => t.status === "done").length;
        const failed = todo.tasks.filter((t) => t.status === "failed").length;
        const pending = todo.tasks.filter((t) => t.status === "pending").length;
        console.log(`\n📋 Experiment Plan`);
        console.log(`  Total:   ${todo.tasks.length} tasks`);
        console.log(`  Done:    ${done}`);
        console.log(`  Failed:  ${failed}`);
        console.log(`  Pending: ${pending}`);
      }

      if (state.experimentResults && state.experimentResults.length > 0) {
        console.log(
          `\n🔬 Experiment Results: ${state.experimentResults.length}`,
        );
        for (const r of state.experimentResults.slice(-3)) {
          console.log(
            `  - ${r.taskTitle}: ${r.summary.slice(0, 80)}...`,
          );
        }
      }

      if (state.paperDraft) {
        console.log(`\n📄 Paper`);
        console.log(`  Title: ${state.paperDraft.title}`);
        console.log(`  LaTeX: ${state.paperDraft.latexFile}`);
        if (state.paperDraft.pdfFile) {
          console.log(`  PDF:   ${state.paperDraft.pdfFile}`);
        }
      }

      console.log();
    });
}

function checkApiKey(provider: string): void {
  const envMap: Record<string, string[]> = {
    anthropic: ["ANTHROPIC_API_KEY"],
    openai: ["OPENAI_API_KEY"],
    google: ["GEMINI_API_KEY"],
    openrouter: ["OPENROUTER_API_KEY"],
    groq: ["GROQ_API_KEY"],
  };

  const candidates = envMap[provider] ?? [`${provider.toUpperCase()}_API_KEY`];
  const found = candidates.some((key) => process.env[key]);

  if (!found) {
    console.error(
      `❌ No API key found for provider "${provider}". Set one of: ${candidates.join(", ")}`,
    );
    process.exit(1);
  }
}
