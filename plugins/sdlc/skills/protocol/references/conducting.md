# Conducting a job

For any conductor: the CEO, CTO, CMO, CLO, or CPO, any role invoked
directly, or a workstream lead (`workstreams.md`).

## Questions and the inbox

Workers' questions come to you; you also raise your own. Give each a priority by
how likely the human would want to weigh in (if unsure, the higher one):

| Priority | Meaning |
|---|---|
| low | Not load-bearing; few consequences. |
| medium | Moderate, reversible consequences. |
| high | A significant direction the human would likely want to set: creative directions, lasting design choices, requirement trade-offs. |
| critical | Must come from the human: every approval the protocol requires, anything irreversible or destructive, security, data loss, external publishing, scope changes. |

**Threshold:** from the invocation, else `inbox_threshold` in
`~/.sdlc/settings.json`, else `high`; the human may change it anytime. Questions at or
above it go to the inbox (`jobs/<job-id>/inbox.md`) and wait there until the
human checks it; never ask them in the conversation. Below it, decide yourself,
choosing what best fits the human's original request, and log the decision in the
inbox. Critical questions always go to the inbox; never decide them.

**Don't wait:** only work that depends on an open question waits; everything else
continues. When no unblocked work remains, stop with one line: how many questions
are waiting and that `/sdlc:inbox` will ask them. Don't ask or list them there.

**Checking the inbox** (`/sdlc:inbox`, or the human asking for your questions):
only this session's jobs (the ones this conversation started or resumed), or a
job the human names. Other sessions' jobs get one line each (job id and how
many questions wait); never ask, mark, or write to them. Announce every
decision made on the human's behalf since the last check, then ask each open
question, most blocking first, until all are answered. Record the answers and
resume the blocked work.

## Delegate, don't do

Management conductors (CEO, CTO, CMO, CLO, CPO) reserve their context
for coordination.
Do only the coordination work you own (plans, staffing, strategy, decisions, job
reports) and **delegate every other task to workers with the right roles, even a
single small one, unless it is absolutely trivial:** answerable from what's
already in your context, or a few reads of job state. A repo change, research, or
anything a role's standing orders or review govern is never trivial. **Unsure
means delegate.** Delegate investigation too (a worker reads the code, logs, or
diffs and reports back), and sign off from workers' reports and evidence rather
than raw output. Other roles conducting themselves do their own work.

## Team size

- **Proportional staffing:** size the team to the job, not the org chart,
  counting agents and hand-offs as well as roles. A job one role can do gets
  that one worker, dispatched directly by whoever conducts (even the CEO), with
  no lead in between. Add a tree lead only when its tree has several tasks, or
  needs planning or integration across them. Add a planning or verification
  role only when it would change the outcome: the Architect for structural or
  interface changes, QA for user-facing behavior or criteria the author's tests
  don't prove, Security or the legal tree when the work materially touches
  their areas. The span and Claude Code limits are ceilings, not targets.
- **Span of control:** coordinate at most **8** tasks per run directly
  (`span` in `~/.sdlc/settings.json`), counting every task you brief over the
  run, not only those running at once. Split a larger part into workstreams
  (`workstreams.md`).
- **Claude Code limits:** at job start, compare the plan with
  `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (default 3; the plan needs 2 for
  workers' own reviews, 3 with workstream leads) and
  `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` (default 20; the plan needs
  agents × (1 + reviewers)). Read them with `printenv`; unset means the default.
  If either is too low for the plan, tell the human which to change and to
  what (`env` in `~/.claude/settings.json`, in a new session), then continue
  within the current limits. This is a notice, not a question.
- **Running agents:** at most `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` ÷
  (1 + reviewers per round), rounded down, across all layers (6 at the
  defaults), since Claude Code refuses spawns past its limit and nothing
  retries them. Queue the rest and dispatch each as a running agent returns.
  Below 1 (2 with workstream leads), the plan can't run: say so in the limits
  notice, with the value it needs, and dispatch nothing.

## Start

1. **Task.** If you were invoked without a task, ask the human what to work on
   right away; never pick work yourself. Then the **fit check** (protocol
   section 3).
2. **Restate the goal** in one sentence before staffing, so a misread agenda is
   caught before anything is spent, followed by one line with the planned team:
   roles, how many agents, and how many layers. This is a notice, not a
   question; don't wait for a reply.
3. **Repo profile:** load it; if missing or stale, staff the Architect to build or
   refresh it. For a single-task job, or working alone, the one worker writes a
   minimal one instead (sections 1 to 4 of `repo-profile.md`).
4. **Open jobs:** report delivered-but-not-yet-accepted tasks and what they hold.
   Clean up nothing.
5. **Plan and staff** the smallest team that owns every deliverable, sized per
   Team size above. Route each
   part to its owner: technical work to the CTO's tree, brand and marketing to the
   CMO's, legal and compliance to the CLO's, product direction, requirements,
   product-usage questions, and UX to the CPO's (PM, Data Analyst, Product
   Designer).
   Tickets needing several roles go to the PM to split into sub-issues first.
   If a tree's part exceeds the span, split it into workstreams
   (`workstreams.md`).
6. **Claude Code limits:** check them against the plan (Team size above).
7. **Job folder:** create `jobs/<job-id>/` with `mkdir` (no `-p`), so an
   existing folder fails instead of being shared; on failure, pick a new
   suffix. Add `job.md`, `ledger.md`, `inbox.md`, and `reports/`.
8. **Dispatch** with complete briefs (`templates.md`): slots, non-overlapping file
   ownership, and branch names with the issue number, within the running-agent
   limit.

## Run

- Track every task's lifecycle state in `job.md`, with the ID of the agent
  doing it, so `/sdlc:stop` can reach it.
- Workers save their full report to `reports/` and return only the summary
  block (`templates.md`). Open a full report only when a decision needs it.
- Relay questions verbatim when workers can't message each other.
- Workers run their own reviews; run the fallback only for workers reporting
  "awaiting review" (protocol section 8).
- When accepting a plan or design, reject any choice made to avoid an approval
  (such as hand-rolling to skip a dependency); the approval is asked instead.
- Re-run the fit check after planning, on escalations, and on scope changes;
  release roles no longer needed.
- Route every question through the inbox rules above; re-dispatch blocked work
  once its questions are answered. Re-read your inbox file before reporting
  blocked work, since answers may have been recorded from another session.
- Merges are done by a technology role once checks pass and review converged:
  a workstream's lead within its workstream; otherwise the CTO (staffed for
  integration if you aren't one).

## Close

Reconcile every run ticket's Project status with its phase (`github.md`,
section 9), including transitions after workers returned (send-backs, merges,
released work). Write the job report (`templates.md`) and leave everything not yet
accepted in place.
