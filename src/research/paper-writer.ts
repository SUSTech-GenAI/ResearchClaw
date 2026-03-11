/**
 * ResearchClaw — Paper Writer
 *
 * Orchestrates the paper writer agent to produce a complete LaTeX paper
 * and compiles it to PDF using pdflatex or xelatex.
 */

import { randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { runEmbeddedPiAgent } from "../agents/pi-embedded-runner/run.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import {
  buildPaperWriterPrompt,
  buildPaperWriterSystemPrompt,
} from "./prompts/paper-writer-agent.js";
import { PAPER_DIR, saveResearchState } from "./state.js";
import type { PaperDraft, PaperSection, ResearchState } from "./types.js";

const log = createSubsystemLogger("research/paper-writer");
const execFileAsync = promisify(execFile);

export type PaperWriterParams = {
  state: ResearchState;
  workspaceDir: string;
  provider?: string;
  model?: string;
  /** Timeout in milliseconds for the paper writer agent (default: 30 minutes). */
  timeoutMs?: number;
  /** Whether to attempt PDF compilation after writing (requires LaTeX). */
  compilePdf?: boolean;
  onPartialReply?: (text: string) => void;
};

export type PaperWriterResult = {
  ok: boolean;
  paperDraft?: PaperDraft;
  error?: string;
};

/**
 * Run the paper writer agent to produce a complete LaTeX paper.
 * Optionally compiles to PDF using pdflatex.
 */
export async function runPaperWriter(
  params: PaperWriterParams,
): Promise<PaperWriterResult> {
  const { state, workspaceDir } = params;
  const timeoutMs = params.timeoutMs ?? 30 * 60 * 1000; // 30 minutes
  const compilePdf = params.compilePdf ?? true;

  log.info("Starting paper writing...");

  await saveResearchState(workspaceDir, { ...state, status: "writing" });

  const paperDir = path.join(workspaceDir, PAPER_DIR);
  await fs.mkdir(paperDir, { recursive: true });

  const sessionId = `research-paper-${randomBytes(4).toString("hex")}`;
  const sessionFile = path.join(workspaceDir, `${sessionId}.jsonl`);
  const runId = `paper-${randomBytes(4).toString("hex")}`;

  const systemPrompt = buildPaperWriterSystemPrompt();
  const userPrompt = buildPaperWriterPrompt(state);

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
      return { ok: false, error: "Paper writer agent produced no output." };
    }

    // Extract LaTeX and BibTeX from agent output
    const { latex, bibtex } = extractLatexAndBibtex(agentOutput);

    if (!latex) {
      // Save raw output for debugging
      await fs.writeFile(path.join(paperDir, "paper-raw.txt"), agentOutput, "utf-8");
      return {
        ok: false,
        error: "Could not extract LaTeX from paper writer output. Raw output saved.",
      };
    }

    // Write LaTeX file
    const latexFile = path.join(paperDir, "paper.tex");
    await fs.writeFile(latexFile, latex, "utf-8");
    log.info(`LaTeX written to: ${latexFile}`);

    // Write BibTeX file
    const bibFile = path.join(paperDir, "references.bib");
    if (bibtex) {
      await fs.writeFile(bibFile, bibtex, "utf-8");
      log.info(`BibTeX written to: ${bibFile}`);
    } else {
      // Generate minimal BibTeX from survey papers
      const minimalBib = generateMinimalBibtex(state);
      await fs.writeFile(bibFile, minimalBib, "utf-8");
    }

    // Extract paper metadata
    const paperTitle = extractLatexTitle(latex) ?? state.surveyReport?.selectedIdea.title ?? "Research Paper";
    const sections = extractLatexSections(latex);

    let pdfFile: string | undefined;

    // Compile to PDF
    if (compilePdf) {
      log.info("Compiling LaTeX to PDF...");
      await saveResearchState(workspaceDir, { ...state, status: "compiling" });

      const compileResult = await compileLaTeX(paperDir, "paper.tex");
      if (compileResult.ok) {
        pdfFile = path.join(paperDir, "paper.pdf");
        log.info(`PDF compiled: ${pdfFile}`);
      } else {
        log.warn(`PDF compilation failed: ${compileResult.error}`);
        // Save compilation log
        if (compileResult.log) {
          await fs.writeFile(
            path.join(paperDir, "compile.log"),
            compileResult.log,
            "utf-8",
          );
        }
      }
    }

    const paperDraft: PaperDraft = {
      title: paperTitle,
      abstract: extractLatexAbstract(latex) ?? "",
      latexFile,
      pdfFile,
      sections,
      createdAt: new Date().toISOString(),
    };

    // Update state
    const finalState: ResearchState = {
      ...state,
      paperDraft,
      status: "done",
    };
    await saveResearchState(workspaceDir, finalState);

    log.info(`Paper writing complete: "${paperTitle}"`);

    return { ok: true, paperDraft };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Paper writer failed: ${message}`);
    return { ok: false, error: message };
  }
}

/** Extract LaTeX and BibTeX source from agent output. */
function extractLatexAndBibtex(text: string): {
  latex?: string;
  bibtex?: string;
} {
  // Extract LaTeX code block
  const latexMatch = text.match(/```latex\s*([\s\S]*?)```/);
  const latex = latexMatch?.[1]?.trim();

  // Extract BibTeX code block
  const bibtexMatch = text.match(/```bibtex\s*([\s\S]*?)```/);
  const bibtex = bibtexMatch?.[1]?.trim();

  // Fallback: look for \documentclass
  if (!latex) {
    const docMatch = text.match(/\\documentclass[\s\S]*?\\end\{document\}/);
    if (docMatch) {
      return { latex: docMatch[0], bibtex };
    }
  }

  return { latex, bibtex };
}

/** Extract the paper title from LaTeX source. */
function extractLatexTitle(latex: string): string | undefined {
  const match = latex.match(/\\title\{([^}]+)\}/);
  return match?.[1]?.replace(/\\\\/g, " ").trim();
}

/** Extract the abstract from LaTeX source. */
function extractLatexAbstract(latex: string): string | undefined {
  const match = latex.match(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/);
  return match?.[1]?.trim().replace(/\s+/g, " ");
}

/** Extract section titles from LaTeX source. */
function extractLatexSections(latex: string): PaperSection[] {
  const sectionMatches = latex.matchAll(/\\section\{([^}]+)\}/g);
  const sections: PaperSection[] = [];

  for (const match of sectionMatches) {
    const title = match[1];
    const name = title.toLowerCase().replace(/\s+/g, "_");
    sections.push({ name, title, citations: [] });
  }

  return sections;
}

/** Generate minimal BibTeX from survey papers. */
function generateMinimalBibtex(state: ResearchState): string {
  const papers = state.surveyReport?.papers ?? [];
  const entries = papers.map((paper) => {
    const key = paper.id.replace(/[^a-zA-Z0-9]/g, "");
    const authors = paper.authors.join(" and ");
    return `@article{${key},
  title={${paper.title}},
  author={${authors}},
  year={${paper.year}},
  url={${paper.url}},
}`;
  });

  return entries.join("\n\n");
}

type CompileResult = {
  ok: boolean;
  error?: string;
  log?: string;
};

/** Compile a LaTeX file to PDF using pdflatex. */
async function compileLaTeX(
  paperDir: string,
  texFile: string,
): Promise<CompileResult> {
  // Try pdflatex first, then xelatex as fallback
  const compilers = ["pdflatex", "xelatex"];

  for (const compiler of compilers) {
    try {
      // Check if compiler is available
      await execFileAsync("which", [compiler]);

      // Run twice to resolve references
      for (let pass = 0; pass < 2; pass++) {
        await execFileAsync(
          compiler,
          [
            "-interaction=nonstopmode",
            "-output-directory",
            paperDir,
            texFile,
          ],
          { cwd: paperDir, timeout: 120_000 },
        );
      }

      // Run bibtex if .bib file exists
      try {
        const bibFile = path.join(paperDir, "references.bib");
        await fs.access(bibFile);
        const baseName = texFile.replace(".tex", "");
        await execFileAsync("bibtex", [baseName], {
          cwd: paperDir,
          timeout: 30_000,
        });
        // Run pdflatex one more time after bibtex
        await execFileAsync(
          compiler,
          [
            "-interaction=nonstopmode",
            "-output-directory",
            paperDir,
            texFile,
          ],
          { cwd: paperDir, timeout: 120_000 },
        );
      } catch {
        // bibtex not available or failed — continue
      }

      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.warn(`${compiler} failed: ${message}`);

      // Try to read the log file
      try {
        const logFile = path.join(paperDir, texFile.replace(".tex", ".log"));
        const logContent = await fs.readFile(logFile, "utf-8");
        if (compilers.indexOf(compiler) === compilers.length - 1) {
          return { ok: false, error: message, log: logContent.slice(-5000) };
        }
      } catch {
        // no log file
      }
    }
  }

  return {
    ok: false,
    error: "No LaTeX compiler (pdflatex/xelatex) found. Install TeX Live to compile PDFs.",
  };
}
