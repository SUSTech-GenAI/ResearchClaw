/**
 * ResearchClaw — Research State Management
 *
 * Handles reading and writing the persistent research state to disk.
 * The state file is the single source of truth for the pipeline's progress.
 */

import fs from "node:fs/promises";
import path from "node:path";
import type { ResearchState } from "./types.js";

export const RESEARCH_STATE_FILENAME = "research-state.json";
export const RESULTS_DIR = "experiment-results";
export const REFERENCES_DIR = "references";
export const PAPER_DIR = "paper";

/** Resolve the path to the research state file within a workspace. */
export function resolveStatePath(workspaceDir: string): string {
  return path.join(workspaceDir, RESEARCH_STATE_FILENAME);
}

/** Load the research state from disk, or return undefined if not found. */
export async function loadResearchState(
  workspaceDir: string,
): Promise<ResearchState | undefined> {
  const statePath = resolveStatePath(workspaceDir);
  try {
    const raw = await fs.readFile(statePath, "utf-8");
    return JSON.parse(raw) as ResearchState;
  } catch {
    return undefined;
  }
}

/** Persist the research state to disk. */
export async function saveResearchState(
  workspaceDir: string,
  state: ResearchState,
): Promise<void> {
  const statePath = resolveStatePath(workspaceDir);
  await fs.mkdir(workspaceDir, { recursive: true });
  const updated: ResearchState = { ...state, updatedAt: new Date().toISOString() };
  await fs.writeFile(statePath, JSON.stringify(updated, null, 2), "utf-8");
}

/** Create the initial research state for a new research goal. */
export function createInitialState(
  researchGoal: string,
  workspaceDir: string,
): ResearchState {
  return {
    version: "1",
    researchGoal,
    workspaceDir,
    status: "init",
    updatedAt: new Date().toISOString(),
  };
}

/** Ensure all required subdirectories exist within the workspace. */
export async function ensureWorkspaceDirs(workspaceDir: string): Promise<void> {
  await fs.mkdir(path.join(workspaceDir, RESULTS_DIR), { recursive: true });
  await fs.mkdir(path.join(workspaceDir, REFERENCES_DIR), { recursive: true });
  await fs.mkdir(path.join(workspaceDir, PAPER_DIR), { recursive: true });
}

/** Write an experiment result file and return its absolute path. */
export async function writeResultFile(
  workspaceDir: string,
  taskId: string,
  content: string,
): Promise<string> {
  const dir = path.join(workspaceDir, RESULTS_DIR);
  await fs.mkdir(dir, { recursive: true });
  const filename = `result-${taskId}-${Date.now()}.md`;
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, content, "utf-8");
  return filePath;
}

/** Write a reference file for a given paper section and return its path. */
export async function writeReferenceFile(
  workspaceDir: string,
  section: string,
  content: string,
): Promise<string> {
  const dir = path.join(workspaceDir, REFERENCES_DIR);
  await fs.mkdir(dir, { recursive: true });
  const filename = `refs-${section.toLowerCase().replace(/\s+/g, "-")}.md`;
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, content, "utf-8");
  return filePath;
}

/** Write the survey report markdown file and return its path. */
export async function writeSurveyReport(
  workspaceDir: string,
  content: string,
): Promise<string> {
  await fs.mkdir(workspaceDir, { recursive: true });
  const filePath = path.join(workspaceDir, "survey-report.md");
  await fs.writeFile(filePath, content, "utf-8");
  return filePath;
}

/** Write the todo list markdown file and return its path. */
export async function writeTodoList(
  workspaceDir: string,
  content: string,
): Promise<string> {
  await fs.mkdir(workspaceDir, { recursive: true });
  const filePath = path.join(workspaceDir, "todo-list.md");
  await fs.writeFile(filePath, content, "utf-8");
  return filePath;
}
