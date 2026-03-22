"""Orchestrator — multi-role research loop: Survey → Plan → Execute → Evaluate → Write."""

from __future__ import annotations

import re
from pathlib import Path

from .agent import Agent, DEFAULT_MODEL
from .survey import run_survey
from .workspace import read_state, update_state

MAX_ITERATIONS = 5


class Orchestrator:
    """Drive the full research loop across agents."""

    def __init__(self, project_dir: Path, model: str = DEFAULT_MODEL):
        self.project_dir = project_dir.resolve()
        self.model = model

    def run(self, idea: str) -> None:
        """Execute the complete research loop for a given idea."""
        state = read_state(self.project_dir)
        iteration = state.get("iteration", 0)

        # ── Phase 1: Survey ─────────────────────────────────────
        print("\n" + "=" * 60)
        print("  Phase 1: SURVEY")
        print("=" * 60 + "\n")
        update_state(self.project_dir, currentStage="survey")

        run_survey(idea, self.project_dir, self.model)

        # ── Phases 2-4: Research loop ───────────────────────────
        for i in range(MAX_ITERATIONS):
            iteration += 1
            update_state(self.project_dir, iteration=iteration)

            # Phase 2: Plan
            action = self._phase_plan(idea, iteration)
            if action == "write-up":
                break

            # Phase 3: Execute
            self._phase_execute(iteration)

            # Phase 4: Evaluate
            action = self._phase_evaluate(iteration)
            if action == "write-up":
                break

            print(f"\n[orchestrator] Decision: {action} — continuing loop...")

        # ── Phase 5: Write ──────────────────────────────────────
        self._phase_write(iteration)

        update_state(self.project_dir, currentStage="done")
        print("\n" + "=" * 60)
        print("  Research loop complete!")
        print("=" * 60)
        self._print_artifacts()

    # ── Phase implementations ────────────────────────────────────

    def _phase_plan(self, idea: str, iteration: int) -> str:
        """Phase 2: Researcher creates/updates the research plan."""
        print("\n" + "=" * 60)
        print(f"  Phase 2: PLAN (iteration {iteration})")
        print("=" * 60 + "\n")
        update_state(self.project_dir, currentStage="planning")

        researcher = Agent("researcher", self.project_dir, self.model)
        p = self.project_dir

        if iteration == 1:
            task = (
                f"You are starting a new research project.\n\n"
                f"Research idea: {idea}\n\n"
                f"A survey has been completed. Read the survey report at "
                f"{p}/literature/survey-report.md and the paper list at "
                f"{p}/literature/paper-list.md.\n\n"
                f"Based on the survey findings:\n"
                f"1. Create/update the research spec at {p}/spec/research-spec.md\n"
                f"2. Create a research plan at {p}/plans/plan-v{iteration}.md\n"
                f"3. Update project memory at {p}/memory/MEMORY.md\n\n"
                f"The plan should include:\n"
                f"- Refined research question and hypothesis\n"
                f"- Experiment design with baselines and metrics\n"
                f"- Success criteria\n"
                f"- Expected outcomes\n\n"
                f"Write all files using the write_file tool."
            )
        else:
            task = (
                f"Continue the research project (iteration {iteration}).\n\n"
                f"Read the latest evaluation at {p}/reports/evaluation-v{iteration - 1}.md "
                f"and update the plan accordingly.\n"
                f"Also read {p}/memory/MEMORY.md for context.\n\n"
                f"Create an updated plan at {p}/plans/plan-v{iteration}.md\n"
                f"Update {p}/memory/MEMORY.md with iteration summary.\n\n"
                f"Write all files using the write_file tool."
            )

        output = researcher.run(task)
        print(f"\n[researcher] Plan phase complete.")
        return "continue"

    def _phase_execute(self, iteration: int) -> None:
        """Phase 3: Executor runs the experiments."""
        print("\n" + "=" * 60)
        print(f"  Phase 3: EXECUTE (iteration {iteration})")
        print("=" * 60 + "\n")
        update_state(self.project_dir, currentStage="executing")

        executor = Agent("executor", self.project_dir, self.model)
        p = self.project_dir

        task = (
            f"Execute the research plan at {p}/plans/plan-v{iteration}.md\n\n"
            f"Read the plan first, then:\n"
            f"1. Decompose into concrete tasks\n"
            f"2. Write experiment code to {p}/experiments/exp{iteration}/code/\n"
            f"3. Set up the environment: use setup_env to create a venv and install packages\n"
            f"   Example: setup_env(\"{p}/experiments/exp{iteration}\", [\"scikit-learn\", \"numpy\"])\n"
            f"4. Run experiments using process_start + process_poll:\n"
            f"   - process_start(\"python code/script.py\", \"{p}/experiments/exp{iteration}\")\n"
            f"   - Then repeatedly call process_poll(proc_id) until status is completed/failed\n"
            f"5. Parse and save results to {p}/experiments/exp{iteration}/results/\n"
            f"6. Write an execution report to {p}/reports/execution-report-v{iteration}.md\n\n"
            f"ENVIRONMENT CONSTRAINTS:\n"
            f"- NO GPU available; use CPU-only implementations\n"
            f"- AVOID torch/tensorflow/keras — they are too large to install\n"
            f"- USE scikit-learn (MLPClassifier supports hidden layers, alpha for L2 regularization)\n"
            f"  and numpy for all neural network experiments\n"
            f"- Prefer lightweight packages: scikit-learn, numpy, pandas, matplotlib, scipy\n\n"
            f"IMPORTANT: Use setup_env for installing Python packages, NOT run_code with pip.\n"
            f"IMPORTANT: Use process_start + process_poll for experiments, NOT run_code.\n"
            f"Always report what happened, even if experiments fail."
        )

        output = executor.run(task, max_iterations=50)
        print(f"\n[executor] Execution phase complete.")

    def _phase_evaluate(self, iteration: int) -> str:
        """Phase 4: Researcher evaluates results and decides next action."""
        print("\n" + "=" * 60)
        print(f"  Phase 4: EVALUATE (iteration {iteration})")
        print("=" * 60 + "\n")
        update_state(self.project_dir, currentStage="evaluating")

        researcher = Agent("researcher", self.project_dir, self.model)
        p = self.project_dir

        task = (
            f"Evaluate the results of iteration {iteration}.\n\n"
            f"Read:\n"
            f"- Execution report: {p}/reports/execution-report-v{iteration}.md\n"
            f"- Research plan: {p}/plans/plan-v{iteration}.md\n"
            f"- Research spec: {p}/spec/research-spec.md\n"
            f"- Project memory: {p}/memory/MEMORY.md\n\n"
            f"Write an evaluation to {p}/reports/evaluation-v{iteration}.md\n\n"
            f"The evaluation MUST end with a Decision section in this exact format:\n\n"
            f"## Decision\n\n"
            f"**Action**: <one of: continue | supplement | pivot | write-up>\n\n"
            f"Explanation of the decision.\n\n"
            f"Choose:\n"
            f"- **continue**: Results are promising, run more experiments in the same direction\n"
            f"- **supplement**: Results are partial, need additional experiments to fill gaps\n"
            f"- **pivot**: Current approach isn't working, need to change direction\n"
            f"- **write-up**: Results are sufficient, ready to write the paper\n\n"
            f"Also update {p}/memory/MEMORY.md with the evaluation summary."
        )

        output = researcher.run(task)
        print(f"\n[researcher] Evaluation phase complete.")

        action = _parse_decision(output)
        print(f"[orchestrator] Parsed decision: {action}")

        # Force write-up after max iterations with no explicit decision
        if iteration >= MAX_ITERATIONS and action not in ("write-up",):
            print(f"[orchestrator] Max iterations reached, forcing write-up.")
            action = "write-up"

        return action

    def _phase_write(self, iteration: int) -> None:
        """Phase 5: Writer produces the paper draft."""
        print("\n" + "=" * 60)
        print(f"  Phase 5: WRITE (iteration {iteration})")
        print("=" * 60 + "\n")
        update_state(self.project_dir, currentStage="writing")

        writer = Agent("writer", self.project_dir, self.model)
        p = self.project_dir

        task = (
            f"Write a research paper draft based on all project materials.\n\n"
            f"IMPORTANT: You MUST use the write_file tool to save each file. "
            f"Do NOT just describe what you would write — actually write the files.\n\n"
            f"Read all relevant files first:\n"
            f"- Research spec: {p}/spec/research-spec.md\n"
            f"- Survey report: {p}/literature/survey-report.md\n"
            f"- Latest reports in {p}/reports/\n"
            f"- Project memory: {p}/memory/MEMORY.md\n\n"
            f"Then create the paper draft using write_file for each:\n"
            f"1. Write an outline to {p}/writing/draft-v1/outline.md\n"
            f"2. Write each section as separate files in {p}/writing/draft-v1/\n"
            f"   - introduction.md\n"
            f"   - related-work.md\n"
            f"   - method.md\n"
            f"   - experiments.md\n"
            f"   - conclusion.md\n"
            f"3. Write review notes to {p}/writing/draft-v1/REVIEW-NOTES.md\n\n"
            f"Ground all claims in evidence from the workspace. "
            f"Mark any evidence gaps as [EVIDENCE NEEDED: description]."
        )

        output = writer.run(task)
        print(f"\n[writer] Writing phase complete.")

    def _print_artifacts(self) -> None:
        """Print a summary of generated artifacts."""
        print("\nGenerated artifacts:")
        for d in ("literature", "spec", "plans", "experiments", "reports", "writing", "memory"):
            dir_path = self.project_dir / d
            if not dir_path.exists():
                continue
            files = sorted(
                p for p in dir_path.rglob("*")
                if p.is_file() and not p.name.startswith(".")
            )
            if files:
                print(f"\n  {d}/")
                for f in files:
                    rel = f.relative_to(self.project_dir)
                    print(f"    {rel}")


# ── Helpers ───────────────────────────────────────────────────────


def _parse_decision(text: str) -> str:
    """Extract the action from a Researcher evaluation's Decision section."""
    # Look for **Action**: <action>
    match = re.search(
        r"\*\*Action\*\*\s*:\s*(continue|supplement|pivot|write-up)",
        text,
        re.IGNORECASE,
    )
    if match:
        return match.group(1).lower()

    # Fallback: look for action keywords in a ## Decision section
    decision_match = re.search(r"##\s*Decision\b(.*?)(?=\n##|\Z)", text, re.DOTALL | re.IGNORECASE)
    if decision_match:
        section = decision_match.group(1).lower()
        for keyword in ("write-up", "pivot", "supplement", "continue"):
            if keyword in section:
                return keyword

    # Default: continue if early, write-up if we can't parse
    return "continue"
