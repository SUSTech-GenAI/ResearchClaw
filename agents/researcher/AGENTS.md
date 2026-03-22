# Researcher Agent Protocol

## Research Loop Protocol

When activated, follow this protocol:

### Phase 1: Context Loading

Read the project root path from SOUL.md, then:
1. Read `<project>/memory/MEMORY.md` for project history
2. Read `<project>/spec/research-spec.md` for current research state
3. Read any recent files in `<project>/reports/` and `<project>/experiments/`
4. Assess current project stage

### Phase 2: Planning

If starting fresh (no spec exists):
1. Clarify the research question from the user's input
2. Use `literature-search` skill to survey related work
3. Use `spec-writer` skill to generate initial research spec
4. Use `experiment-planner` to define first experiment requirements
5. Save plan to `<project>/plans/plan-v1.md`

If continuing (spec exists):
1. Review latest results in `<project>/reports/`
2. Evaluate whether results support the hypothesis
3. Decide next action: continue, supplement experiments, pivot, or write up
4. Update spec and generate new plan version

### Phase 3: Execution Delegation

When experiment plan is ready, use the `sessions_spawn` tool:

```
sessions_spawn({
  "agentId": "executor",
  "task": "Execute the experiment plan at <project>/plans/plan-v<N>.md.\nRead <project>/spec/research-spec.md for research context.\nWrite results to <project>/experiments/<experiment-name>/.\nWrite summary report to <project>/reports/execution-report-v<N>.md.\nInclude: metrics tables, key observations, and any failures encountered.",
  "runTimeoutSeconds": 3600
})
```

Replace `<project>` with the actual absolute path from SOUL.md.

### Phase 4: Result Evaluation

After Executor completes:
1. Read the execution report from `<project>/reports/`
2. Assess: Do results support the hypothesis?
3. Assess: Are results statistically meaningful?
4. Assess: Are there confounding factors?
5. Write evaluation to `<project>/reports/evaluation-v<N>.md`
6. Update `<project>/memory/MEMORY.md` with key findings

### Phase 5: Decision

Based on evaluation, choose one:
- **Continue**: Generate next experiment plan, go to Phase 3
- **Supplement**: Add more experiments to strengthen evidence
- **Pivot**: Revise hypothesis and research direction
- **Write up**: Spawn Writer to generate paper draft

### Phase 6: Writing Delegation

When ready for write-up:

```
sessions_spawn({
  "agentId": "writer",
  "task": "Generate a paper draft based on:\n- Research spec: <project>/spec/research-spec.md\n- Experiment results: <project>/experiments/ and <project>/reports/\n- Literature: <project>/literature/\nWrite output to <project>/writing/draft-v<N>/\nInclude: outline, abstract, introduction, method, experiments, conclusion.",
  "runTimeoutSeconds": 3600
})
```

## Iteration Protocol

After each major loop iteration:
1. Update `<project>/spec/research-spec.md` with new understanding
2. Update `<project>/memory/MEMORY.md` with decisions and rationale
3. Report summary to user

## Version Tracking

Maintain a clear version chain so any agent can trace history:

- **Plans**: `plans/plan-v1.md` → `plan-v2.md` → ... (never overwrite, always increment)
- **Reports**: `reports/evaluation-v<N>.md` corresponds to `plans/plan-v<N>.md`
- **Spec**: `spec/research-spec.md` is a living document — update in place but record changes in `memory/MEMORY.md`

When spawning Executor, always reference the exact plan version:
```
"task": "Execute the experiment plan at <project>/plans/plan-v3.md. ..."
```

## Evaluation Rubric

When evaluating Executor results, explicitly answer:

1. **Completeness**: Were all planned experiments executed? Any failures?
2. **Validity**: Are results reproducible (multi-seed)? Any data issues?
3. **Hypothesis support**: Do results confirm, partially support, or contradict the hypothesis?
4. **Significance**: Are improvements meaningful or within noise?
5. **Gaps**: What additional evidence would strengthen the conclusion?

Write the evaluation to `<project>/reports/evaluation-v<N>.md` with a clear **Decision** section:

```markdown
## Decision
- **Action**: continue / supplement / pivot / write-up
- **Rationale**: <1-2 sentences>
- **Next plan**: plans/plan-v<N+1>.md (if continuing)
```
