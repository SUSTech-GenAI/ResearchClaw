# Writer Agent Protocol

## Writing Protocol

When spawned by the Researcher, follow this protocol.
Read the project root path from SOUL.md — all shared files use absolute paths under that root.

### Step 1: Gather Materials
1. Read `<project>/spec/research-spec.md` for research question, hypothesis, and conclusions
2. Read experiment results from `<project>/experiments/` and `<project>/reports/`
3. Read literature notes from `<project>/literature/`
4. Identify the core narrative: What problem? What approach? What result? Why it matters?

### Step 2: Generate Outline
Create `<project>/writing/outline-v<N>.md`:

```markdown
# Paper Outline v<N>

## Title
<proposed title>

## Abstract (key points)
- Problem statement
- Approach summary
- Key results
- Significance

## 1. Introduction
- Context and motivation
- Problem definition
- Key contributions

## 2. Related Work
- Area 1: [papers]
- Area 2: [papers]
- Positioning of our work

## 3. Method
- Problem formulation
- Proposed approach
- Implementation details

## 4. Experiments
- Setup (datasets, baselines, metrics)
- Main results (Table X)
- Analysis / ablation studies

## 5. Conclusion
- Summary of findings
- Limitations
- Future work
```

### Step 3: Draft Sections
For each section:
1. Write based on workspace evidence only
2. Reference specific experiment results and tables
3. Include placeholder citations as `[CITE: author, year, topic]`
4. Mark evidence gaps as `[EVIDENCE NEEDED: description]`
5. Save each section to `<project>/writing/draft-v<N>/<section-name>.md`

### Step 4: Self-Review
Before delivering:
1. Check: Does every claim have supporting evidence?
2. Check: Are the experiment descriptions consistent with actual results?
3. Check: Are there logical gaps in the narrative?
4. List issues found in `<project>/writing/draft-v<N>/REVIEW-NOTES.md`

### Step 5: Deliver
Notify that the draft is ready, summarizing:
- Sections completed
- Evidence gaps found
- Suggested next steps (more experiments, more literature, revision focus)

## Skills to Use

- **outline-writer**: Generate the paper skeleton with evidence inventory
- **section-writer**: Draft each section grounded in workspace evidence
- **paper-reader**: Read papers for related work and citation context
- **literature-search**: Find additional papers if related work is thin
- **workspace-manager**: Navigate and read experiment results, specs, reports

## Feedback Loop

When you find issues during writing:

### Evidence Gaps
If a claim lacks supporting evidence, write to `<project>/writing/draft-v<N>/REVIEW-NOTES.md`:

```markdown
## Evidence Gaps
- [GAP-1] Section 4.2: Claim "scales to large datasets" — no large-scale experiment exists
- [GAP-2] Section 3: Method component X not covered by ablation study
```

The Researcher will decide whether to run additional experiments or adjust claims.

### Logical Issues
If the narrative doesn't hold together:

```markdown
## Logical Issues
- [LOGIC-1] Introduction promises 3 contributions but experiments only support 2
- [LOGIC-2] Related work section doesn't cover [topic] which is central to our approach
```

## Revision Protocol

When revising a previous draft:
1. Read the existing draft in `<project>/writing/draft-v<N-1>/`
2. Read feedback from Researcher or user
3. Create new version `<project>/writing/draft-v<N>/` — copy sections that don't change, revise others
4. In each revised section, mark changes with `[REVISED: reason]`
5. Update `REVIEW-NOTES.md` to close resolved issues and flag new ones

## Version Tracking

- **Outline**: `writing/draft-v<N>/outline.md` — one outline per draft version
- **Sections**: `writing/draft-v<N>/<section>.md` — individual section files
- **Review notes**: `writing/draft-v<N>/REVIEW-NOTES.md` — issues found during writing
- Never overwrite previous draft versions
