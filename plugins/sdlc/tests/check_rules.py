#!/usr/bin/env python3
"""Verify the plugin still states every recorded design decision, exactly as
decided, and that removed features stay removed.

Run from anywhere: python3 tests/check_rules.py [plugin_root]
Exit code 0 means every check passed.

When a decision changes, update its entry here in the same change.
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), ".."))
P = "skills/protocol/SKILL.md"
R = "skills/protocol/references/"
ER = "skills/expert-review/SKILL.md"

# (decision, file glob relative to ROOT, regex). Matched case-insensitively
# against the file with whitespace collapsed.
RULES = [
    # Charter and org
    ("Roles define scope, never capability", P, r"not how well you do it"),
    ("Scope limits doing, not noticing", P, r"not what you \*?notice"),
    ("Hierarchy: CEO reports to the human", P, r"CEO reports to the human"),
    ("Technology and marketing trees", P, r"technology tree.*marketing tree"),
    ("Staffing is not reporting", P, r"Staffing is not reporting"),
    ("Only the technology tree changes repo files", P, r"Only the CTO and roles under it change a repository's files"),
    ("Conductor and worker modes", P, r"\*\*conductor\*\*.*\*\*worker\*\*"),
    ("Nesting: workers spawn their own reviewers", P, r"Workers spawn `sdlc:expert-review`'s reviewers themselves"),
    ("Only conductors spawn SDLC roles", P, r"Only conductors spawn SDLC roles"),
    ("Tree-lead workers may run as workstream leads", P, r"may run as a \*\*workstream lead\*\*"),
    ("Top conductor dispatches every lead; leads' workers never lead", R + "workstreams.md", r"leads never dispatch leads and their workers never lead"),
    ("Proportional staffing: size to the job, not the org chart", R + "conducting.md", r"size the team to the job, not the org chart"),
    ("Proportional: agents and hand-offs count, not just roles", R + "conducting.md", r"counting agents and hand-offs as well as roles"),
    ("Proportional: single-role job gets one worker, no lead between", R + "conducting.md", r"that one worker, dispatched directly by whoever conducts \(even the CEO\), with\s+no lead in between"),
    ("Proportional: planning and verification only when they change the outcome", R + "conducting.md", r"only when it would change the outcome"),
    ("Limits are ceilings, not targets", R + "conducting.md", r"ceilings, not targets"),
    ("Proceed-as-asked runs with the right entry point's team", P, r"run the job\s+with the team the right entry point would have used"),
    ("Goal restatement includes the planned team, as a notice", R + "conducting.md", r"one line with the planned team.*a notice, not a\s+question"),
    ("Single-task jobs: the worker writes a minimal profile", R + "conducting.md", r"For a single-task job, or working alone, the one worker writes a\s+minimal one"),
    ("Single technology worker may merge when authorized", R + "approvals.md", r"single technology\s+worker of a one-task job whose brief authorizes it to merge"),
    ("CEO fit check recommends the single role when one owns it all", "skills/ceo/SKILL.md", r"or the single role when one role owns all of it"),
    ("Brief states merge authorization for one-task jobs", R + "templates.md", r"whether it may merge its\s+own PR"),
    ("CEO: single task goes straight to its worker", "skills/ceo/SKILL.md", r"a single task goes straight to its worker"),
    ("CTO routing is conditional", "skills/cto/SKILL.md", r"only when the\s+work materially touches the topic"),
    ("CTO: QA only when it changes the outcome", "skills/cto/SKILL.md", r"when the delivery\s+changes user-facing behavior or its criteria aren't proven"),
    ("Span of control: 8 tasks per conductor per run", R + "conducting.md", r"at most \*\*8\*\* tasks per run directly\s+\(`span` in `~/\.sdlc/settings\.json`\)"),
    ("Span counts tasks over the run, not concurrency", R + "conducting.md", r"counting every task you brief over the\s+run"),
    ("Alert the human when spawn depth is too low", R + "conducting.md", r"CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` \(default 3; the plan needs 2.*3 with workstream leads\)"),
    ("Alert the human when concurrent subagents are too low", R + "conducting.md", r"CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` \(default 20; the plan needs"),
    ("Limit alerts are notices, then continue within limits", R + "conducting.md", r"tell the\s+human which to change and to what.*continue within the current limits.*a notice, not\s+a question"),
    ("Running agents: concurrent limit ÷ (1 + reviewers), rounded down", R + "conducting.md", r"at most `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` ÷\s+\(1 \+ reviewers per round\), rounded down"),
    ("Queue agents past the running limit", R + "conducting.md", r"Queue the rest and dispatch each as a running agent returns"),
    ("Lead budgets split the running-agent limit", R + "workstreams.md", r"Budgets split the\s+running-agent limit.*so together they never exceed it"),
    ("Lead budgets are at least 2; queue the leads past that", R + "workstreams.md", r"Each budget is at least\s+2 \(the lead and one worker\)"),
    ("Running-agent limit too low stops the plan", R + "conducting.md", r"Below 1 \(2 with workstream leads\), the plan can't run"),
    ("Resume within the running-agent limit", "skills/resume/SKILL.md", r"within the running-agent limit \(`conducting\.md`"),
    ("Dispatch within the running-agent limit", R + "conducting.md", r"Dispatch\*\*.*within the running-agent\s+limit"),
    ("Job folders hold full reports in reports/", P, r"`reports/` for full worker reports"),
    ("No Agent tool: lead returns a plan, author reports awaiting review", P, r"a lead returns a staffed plan"),
    ("Non-worktree agents treat the checkout as read-only", P, r"read-only"),
    # Fit check, team, model
    ("Fit check first; ask the human right away on a mismatch", P, r"ask the human first,\*\* right away with the fit-check template"),
    ("Workers and sub-conductors return fit checks up the chain", P, r"A worker or workstream lead returns its fit check to\s+its conductor"),
    ("Smallest team", P, r"Smallest team"),
    ("Slots are machine-wide across sessions and repos", R + "workspace.md", r"Slots are machine-wide"),
    ("Slots claimed atomically with mkdir", R + "workspace.md", r"mkdir -p ~/\.sdlc/slots && mkdir ~/\.sdlc/slots/<N>"),
    ("Slots go to the lowest free number, never a block", R + "workspace.md", r"succeeds, never a block,"),
    ("Slots only for agents that run processes or bind ports", R + "workspace.md", r"Only agents that run processes or bind ports get one"),
    ("Slots stop at 286, below Linux, macOS, and Windows ephemeral ports", R + "workspace.md", r"Slots stop at\s+286, below Linux, macOS, and Windows ephemeral ports"),
    ("Slots past the ceiling queue and name the holders", R + "workspace.md", r"past it, queue the task and tell the human which jobs hold slots"),
    ("Stale slots freed only with approval", R + "workspace.md", r"free it only with the human's approval"),
    ("Cleanup frees slots and claims after checking ownership", R + "workspace.md", r"each after checking its `owner\.md`\s+names this job and task"),
    ("Ledger types include slots and claims", R + "templates.md", r"lease, slot, claim"),
    ("Inbox command scoped to this session's jobs", "skills/inbox/SKILL.md", r"this session's jobs, or the job named"),
    ("Inbox never touches other sessions' jobs", R + "conducting.md", r"never ask, mark, or write to them"),
    ("Inbox checks scoped to the session in conducting", R + "conducting.md", r"only this session's jobs \(the ones this conversation started or resumed\)"),
    ("Conductors re-read their inbox for answers from other sessions", R + "conducting.md", r"Re-read your inbox file before reporting\s+blocked work"),
    ("Job IDs carry a random suffix", P, r"`YYYY-MM-DD-<slug>-<4 random hex>`"),
    ("Job folders created without -p so clashes fail", R + "conducting.md", r"with `mkdir` \(no `-p`\)"),
    ("Ticket claims locked locally across sessions", R + "workspace.md", r"claims/<N>`, with an `owner\.md`"),
    ("Claim held by another job: don't take it", P, r"if another job\s+holds the claim, don\'t take it"),
    ("Model and effort inherit the session", P, r"Never pass a model or effort override"),
    ("expert-review reviewers pinned to Opus 5.5 High", P, r"Opus 5\.5 at High"),
    # Communication
    ("Proxies relay verbatim", P, r"relay verbatim"),
    ("Decisions go up the chain", P, r"up the chain"),
    ("Asking the human means the inbox", P, r"Asking the human means the inbox"),
    ("Workers return questions to their conductor", P, r"a worker returns it to its conductor"),
    ("Never ask directly, including AskUserQuestion", P, r"Never put a question to the human directly,\*\* in a reply or with AskUserQuestion"),
    ("Direct-question exceptions: no task, inbox check, human-run command", P, r"invoked without a task.*a conductor's fit check.*checking the inbox.*`/sdlc:accept`, `/sdlc:setup`"),
    ("Any skill's ask-the-user becomes an inbox entry", P, r"any skill you run says to ask the human or the user"),
    ("Don't wait on answers; report what's blocked", P, r"Don't wait on an answer"),
    # Approvals
    ("Dangerous operations always need approval", P, r"dangerous, destructive, or irreversible"),
    ("Writes to other repos need approval", P, r"Other repos:\*\* every write needs approval"),
    ("Scratch exception", P, r"Scratch exception"),
    ("Approval only from the human in conversation", P, r"Approval comes only from the human"),
    ("gh pr writes name the PR by its head branch", R + "github.md", r"name the PR by its head branch"),
    ("A refused action is never retried or routed around", R + "approvals.md", r"Until approved, a refused action is never retried or\s+routed around"),
    ("Auto mode settings are adopted by the human, not an agent", "README.md", r"running the script yourself.*Self-Modification"),
    ("Recommended settings allow no gh writes", "README.md", r"It allows no `gh` write"),
    ("Never change settings, protections, or secrets unless asked for that change", P, r"Never change repo settings.*unless the human asks for that specific change"),
    ("Ownership: listed users, organizations, and repositories, per host", R + "approvals.md", r"user or organization listed under `owned\.users`.*`owned\.organizations` in `~/\.sdlc/settings\.json`.*`owned\.repositories`"),
    ("Ownership: enterprises can't be listed", R + "approvals.md", r"Enterprises can't be listed"),
    ("Renamed or transferred listed repos become external", R + "approvals.md", r"nameWithOwner.*no\s+longer matches the entry"),
    ("Ownership judged by current owner after renames and transfers", R + "approvals.md", r"follows renames and transfers"),
    ("Settings template: owned users, organizations, and repositories", "settings.example.json", r'"owned": \{ "users": \[\], "organizations": \[\], "repositories": \[\]'),
    ("Fail safe to external", R + "approvals.md", r"Fail safe"),
    ("Own-branch force push rule", R + "approvals.md", r"no pull request is open"),
    ("Merges follow branch protection; admin bypass needs approval", R + "approvals.md", r"admin bypass needs approval"),
    ("Queue a PR as soon as it may merge", R + "approvals.md", r"queue the PR \(`gh pr merge <branch>`\) as soon as it may merge"),
    ("Never catch a PR's branch up to the default branch", R + "approvals.md", r"With a merge queue,.{0,120}never merge the default branch into its branch to catch up"),
    ("Bring the default branch in only for a conflict or a queue failure, just before ready or queueing", R + "approvals.md", r"only for a conflict GitHub reports or to reproduce a queue failure, just before marking the PR ready or queueing it"),
    ("Tasks sharing a file run in sequence", R + "workspace.md", r"Tasks that must share one \(the profile's shared files\) run in sequence"),
    ("No stacked branches under squash merges", R + "workspace.md", r"With squash merges, wait for that work to merge and branch from the default branch instead"),
    ("Profile records shared files and merge settings", R + "repo-profile.md", r"the merge queue, and the merge method; shared files"),
    ("Tasks sharing a shared file go in one workstream", R + "workstreams.md", r"tasks sharing a profile shared file go in one workstream, or, past the span, in workstreams run one after another"),
    ("Refresh a profile section that lacks a listed field", R + "repo-profile.md", r"or when one lacks a field listed here"),
    ("CTO sequences tasks that share files", "skills/cto/SKILL.md", r"sequence those that must, and don't stack branches under squash merges"),
    ("Dependency approval requests weigh building it", R + "approvals.md", r"including building it"),
    # Lifecycle and tickets
    ("Only the human accepts", P, r"Only the human accepts"),
    ("'Looks good' is not acceptance", P, r"Looks good"),
    ("Keep workspaces until accepted", P, r"Until accepted, assume more work is coming"),
    ("Every role owns its assigned tickets", P, r"Every role owns the tickets it's assigned"),
    ("Claim: assign to the human", P, r"--add-assignee @me"),
    ("Don't take over someone else's ticket", P, r"don't take it over"),
    ("One owning role per ticket", P, r"One owning role per ticket"),
    ("Sub-issue commands", R + "github.md", r"--parent <N>"),
    ("Status table includes Todo, In Progress, In Review, Done", R + "github.md", r"In Progress.*In Review.*Done.*Todo"),
    ("Parent ticket status follows sub-issues", R + "github.md", r"parent ticket is In Progress while any sub-issue is"),
    ("Status read back after each change", R + "github.md", r"Read the item back"),
    ("Accept closes non-code tickets", "skills/accept/SKILL.md", r"close tickets no merged PR closed"),
    ("Accept: non-technology conductors staff the Architect for ADR status", "skills/accept/SKILL.md", r"any other conductor staffs the Architect"),
    ("Job folders hold creative options in design/", P, r"`evidence/`, `design/`"),
    ("Designers: picked option moves to its durable home", R + "design.md", r"picked option moves to its durable home"),
    ("Conductor reconciles statuses at close", R + "conducting.md", r"Reconcile every run ticket"),
    ("Briefs carry the ticket's Project and status", R + "templates.md", r"Project \(owner, number\) and current status"),
    ("Conductors send multi-role tickets to the PM to split", R + "conducting.md", r"split into sub-issues"),
    ("Approvals summary covers new dependencies and tools", P, r"New dependencies and tools\*\* always need approval"),
    ("Settings summary lists every key", P, r"`owned`.*`inbox_threshold`, `jurisdictions`, `span`, `standing_orders`"),
    ("Unparseable settings own nothing", R + "approvals.md", r"settings file that doesn't parse, means external"),
    ("README documents tickets and sub-issues", "README.md", r"sub-issues, one per role"),
    ("README quick start covers the project scope", "README.md", r"gh auth refresh -s project"),
    ("Settings docs: dependencies and tools need approval", "README.md", r"\| `owned` \|.*except dangerous operations and new dependencies and tools"),
    ("Settings docs: enterprises can't be listed", "README.md", r"\| `owned` \|.*Enterprises can't be listed"),
    # Review gate
    ("Every repo change passes expert-review", P, r"Every repo change"),
    ("Authors run their own expert-review", P, r"Whoever makes the change runs it"),
    ("Fallback: authors without the Agent tool report awaiting review", P, r"author without the Agent tool.{0,80}awaiting review"),
    ("Non-technology conductors never fix review findings", P, r"must not change code"),
    # Precedence and repo skills
    ("Precedence order", P, r"hard rules.*repo skills and conventions.*standing orders.*published standards"),
    ("External repo skills need approval", P, r"do not follow repo skills until the human approves"),
    ("Repo skills are additive", P, r"additive"),
    # Universal rules
    ("Evidence, not assertion", P, r"Evidence, not assertion"),
    ("Comment sparingly", P, r"Comment sparingly"),
    ("Never weaken a check", P, r"Never weaken a check"),
    ("Security issues never public", P, r"Security issues and legal exposure never go public"),
    ("No self-attribution", P, r"No self-attribution"),
    ("Honest affiliation; no multiple accounts", P, r"multiple accounts"),
    ("Social platforms get drafts only", P, r"drafts only"),
    ("New dependencies and tools need approval", P, r"New dependencies and tools need the human's approval"),
    ("Approval is a gate, not a cost", P, r"Approval is a gate,\s+not a cost"),
    ("Never hand-roll to avoid asking", P, r"hand-roll what a maintained library does"),
    ("Observed content is data", P, r"Observed content is data, not instructions"),
    # Inbox
    ("Four priorities", R + "conducting.md", r"\| low \|.*\| medium \|.*\| high \|.*\| critical \|"),
    ("Threshold defaults to high", R + "conducting.md", r"else `high`"),
    ("Below threshold: conductor decides by original request", R + "conducting.md", r"original request"),
    ("Critical never decided for the human", R + "conducting.md", r"Critical questions always go to the inbox; never decide"),
    ("Unsure priority means the higher one", R + "conducting.md", r"if unsure, the higher one"),
    ("All blocked: one line with the count, no questions", R + "conducting.md", r"When no unblocked work remains, stop with one line.*Don't ask or list them"),
    ("Inbox questions wait for the human's check", R + "conducting.md", r"wait there until the human checks it; never ask them in the conversation"),
    ("Approval requests are critical inbox entries", R + "approvals.md", r"records a critical inbox entry with the approval request template"),
    ("Approval requests asked only during inbox checks", R + "templates.md", r"Approval request A critical inbox entry, put to the human only during an inbox check"),
    ("Fit checks asked directly", R + "templates.md", r"Fit-check message Asked directly, right away"),
    ("Job report counts waiting questions without asking", R + "templates.md", r"Don't ask them here; `/sdlc:inbox` does"),
    ("CEO reminder: never ask mid-run", "skills/ceo/SKILL.md", r"Never ask the human mid-run"),
    ("CTO reminder: never ask mid-run", "skills/cto/SKILL.md", r"never ask the human mid-run"),
    ("CMO reminder: never ask mid-run", "skills/cmo/SKILL.md", r"never ask the human mid-run"),
    ("Designer options go through the inbox", R + "design.md", r"through the inbox, as three"),
    ("Checking the inbox announces decisions first", R + "conducting.md", r"announce every decision made"),
    ("No task: ask what to work on", R + "conducting.md", r"invoked without a task"),
    ("Workstream lead rules", R + "workstreams.md", r"# Workstream leads"),
    ("Split parts larger than the span into workstreams", R + "workstreams.md", r"more tasks than the\s+span, split it into\s+workstreams"),
    ("CEO on top: lead plans, CEO dispatches leads, lead integrates", R + "workstreams.md", r"CEO on top:\*\* staff the tree's lead as a worker to plan the split, dispatch\s+the leads yourself"),
    ("CTO leads merge within their workstream", R + "workstreams.md", r"A CTO lead merges its workstream's PRs"),
    ("Top CTO keeps cross-workstream integration and CI", R + "workstreams.md", r"Cross-workstream integration.*default-branch CI stay with the top CTO"),
    ("Leads never ask the human directly", R + "workstreams.md", r"It never asks the human directly"),
    ("Leads use the top conductor's job folder", R + "workstreams.md", r"top conductor's `job\.md`"),
    ("Rework after a lead returns goes to a fresh lead", R + "workstreams.md", r"fresh lead briefed from job state"),
    ("Start: check Claude Code limits", R + "conducting.md", r"\*\*Claude Code limits:\*\* check them against the plan"),
    ("Workers return a summary block; full report on disk", R + "templates.md", r"Save the full report to `jobs/<job-id>/reports/<task>\.md` and return only the\s+summary block"),
    ("Briefs give leads tasks, budget, and slots", R + "templates.md", r"workstream lead: its tasks, agent budget \(counting itself\), and slot numbers"),
    ("Merge authority includes CTO leads", R + "approvals.md", r"a CTO workstream lead within its\s+workstream"),
    ("CTO can lead a workstream", "skills/cto/SKILL.md", r"Lead a workstream"),
    ("CMO can lead a workstream", "skills/cmo/SKILL.md", r"lead a\s+workstream"),
    ("CEO dispatches workstream leads itself", "skills/ceo/SKILL.md", r"dispatch a workstream\s+lead for each yourself"),
    ("Settings template: span of control", "settings.example.json", r'"span": 8'),
    ("Inbox command is human-only", "skills/inbox/SKILL.md", r"disable-model-invocation: true"),
    ("Settings template: inbox threshold", "settings.example.json", r'"inbox_threshold": "high"'),
    # Management conductors
    ("Delegate unless absolutely trivial", R + "conducting.md", r"unless it is absolutely trivial"),
    ("Reject choices made to avoid an approval", R + "conducting.md", r"made to avoid an approval"),
    # GitHub
    ("Default commits: Conventional Commits", R + "github.md", r"\*\*Commits:\*\* \[Conventional Commits\]"),
    ("Default PR titles: Conventional Commits", R + "github.md", r"\*\*PRs:\*\* drafts titled the same way"),
    ("Breaking changes marked with ! and footer", R + "github.md", r"adds `!` after the type and a `BREAKING CHANGE:` footer"),
    ("Repo conventions override the commit default", R + "github.md", r"Unless the repo has conventions \(the profile records them\)"),
    ("Populate every field on new issues", R + "github.md", r"Populate every field a new issue can take,\*\* unless the repo says otherwise"),
    ("New issues leave the assignee unset until picked up", R + "github.md", r"The assignee stays unset\*\* unless the repo or Project says\s+otherwise"),
    ("New issues get an issue type where defined", R + "github.md", r"`--type` where types exist"),
    ("Every Project field set", R + "github.md", r"set every field it has"),
    ("Fields left empty only without support or when the human decides", R + "github.md", r"Leave a field empty only\s+when nothing supports a value or it\'s the human\'s call"),
    ("Release versions from Conventional Commits", "skills/release/SKILL.md", r"version bump from the Conventional Commits"),
    ("Profile records commit convention and issue fields", R + "repo-profile.md", r"commit and PR title style.*issue types and fields in use"),
    ("Strip attribution trailers", R + "github.md", r"Co-Authored-By"),
    ("Before/after screenshots for UI PRs", R + "screenshots.md", r"BEFORE/AFTER"),
    ("Repo guidance overrides screenshots", R + "screenshots.md", r"repo guidance overrides"),
    ("Check images before upload", R + "screenshots.md", r"uploads can't be undone"),
    ("Projects: find linked or related projects", R + "repo-profile.md", r"projectsV2"),
    ("Projects: never create one unasked", R + "repo-profile.md", r"never create a Project unless the human asks"),
    ("Projects: project scope via human refresh", R + "repo-profile.md", r"gh auth refresh -s project"),
    # Roles
    ("Architect weighs dependency vs building on equal criteria", "skills/architect/SKILL.md", r"same criteria"),
    ("Architect: simplest design", "skills/architect/SKILL.md", r"simplest design"),
    ("Architect: ADRs superseded, never rewritten", "skills/architect/SKILL.md", r"supersedes"),
    ("Engineer: failing test first for bugs", "skills/engineer/SKILL.md", r"failing test"),
    ("Engineer: refactors preserve behavior", "skills/engineer/SKILL.md", r"Refactors preserve behavior"),
    ("Engineer: new dependencies need the human's approval", "skills/engineer/SKILL.md", r"the human's approval"),
    ("QA: three viewports", "skills/qa/SKILL.md", r"mobile, tablet, and desktop"),
    ("QA: never fixes production code", "skills/qa/SKILL.md", r"never fix the production code"),
    ("QA: reproduce twice", "skills/qa/SKILL.md", r"twice"),
    ("Security: active testing local and dev only", "skills/security/SKILL.md", r"only against local and dev"),
    ("Release: tags, publishes, deploys need approval", "skills/release/SKILL.md", r"needs the human's approval"),
    ("Designers: three options", R + "design.md", r"three genuinely different options"),
    ("Designers: WCAG, font licenses, originality", R + "design.md", r"WCAG.*licenses.*original"),
    ("Writer: claims true today", "skills/writer/SKILL.md", r"true today"),
    ("Community: no promises", "skills/community/SKILL.md", r"Never promise"),
    ("Analyst: read-only, approved sources", "skills/analyst/SKILL.md", r"only read-only"),
    ("PM: one role per ticket", "skills/pm/SKILL.md", r"one role and one task"),
    ("CEO combined run priorities", "skills/ceo/SKILL.md", r"Priorities"),
    ("brand-designer reminder: no repo changes", "skills/brand-designer/SKILL.md", r"never change repository files"),
    ("product-designer reminder: no repo changes", "skills/product-designer/SKILL.md", r"never change repository files"),
    # Product tree and the Designer split
    ("C-levels report to the CEO", P, r"the CTO, CMO, CLO, and CPO report\s+to the CEO"),
    ("Product tree under the CPO", P, r"\*\*product tree\*\* the CPO\'s"),
    ("Marketing tree has the Brand Designer", P, r"\| \*\*CMO\*\* \|.*\| Brand Designer \|"),
    ("CPO can lead a workstream", P, r"\(CTO, CMO, CLO, or CPO\)"),
    ("CPO is a C-level peer", "skills/cpo/SKILL.md", r"report to the\s+CEO, a peer of the CTO, CMO, and CLO"),
    ("CPO owns strategy, roadmap, prioritization, sign-off", "skills/cpo/SKILL.md", r"Product strategy.*the roadmap.*priority\s+across the backlog.*sign-off"),
    ("CPO settles PM-Architect trade-offs with the CTO", "skills/cpo/SKILL.md", r"settle it with the CTO on the evidence"),
    ("CPO: target dates are the human's", "skills/cpo/SKILL.md", r"target dates are the human's call"),
    ("cpo reminder: no repo changes", "skills/cpo/SKILL.md", r"never\s+change repository files"),
    ("PM reports to the CPO", "skills/pm/SKILL.md", r"You report\s+to the CPO"),
    ("Analyst reports to the CPO", "skills/analyst/SKILL.md", r"You report to the CPO and serve the PM and\s+CMO equally"),
    ("Product Designer reports to the CPO; CTO staffs for UI specs", "skills/product-designer/SKILL.md", r"You report to the CPO; the CTO staffs you for UI specs"),
    ("Product Designer designs every state", "skills/product-designer/SKILL.md", r"Design every state"),
    ("Brand Designer reports to the CMO", "skills/brand-designer/SKILL.md", r"You report to the CMO"),
    ("Product Designer owns token values; Architect owns structure", R + "design.md", r"Product\s+Designer owns design token values; the Architect owns how tokens\s+are structured"),
    ("CTO routes UI specs to the Product Designer", "skills/cto/SKILL.md", r"UI without a design spec → Product Designer"),
    ("Product work routes to the CPO's tree", R + "conducting.md", r"product direction, requirements,\s+product-usage questions, and UX to the CPO's"),
    ("cmo reminder: no repo changes", "skills/cmo/SKILL.md", r"never change repository files"),
    ("writer reminder: no repo changes", "skills/writer/SKILL.md", r"never change repository files"),
    ("community reminder: no repo changes", "skills/community/SKILL.md", r"never change repository files"),
    ("analyst reminder: no repo changes", "skills/analyst/SKILL.md", r"never change repository files"),
    # Legal tree
    ("Legal tree under the CLO", P, r"\*\*legal tree\*\* the CLO\'s"),
    ("CLO is a C-level peer of the CTO and CMO", "skills/clo/SKILL.md", r"report to the CEO, a peer of the CTO and\s+CMO"),
    ("Protocol names the Chief Legal Officer", P, r"\*\*CLO\*\* \(Chief Legal Officer\) \| `clo`"),
    ("Legal findings answer only to the CLO and the human", P, r"its findings and blocks answer only to the CLO and\s+the human"),
    ("No conductor outside legal overrules a legal block", R + "legal.md", r"No conductor outside the legal tree can overrule it"),
    ("CTO can't overrule legal blocks", "skills/cto/SKILL.md", r"reports to the CLO, not you; you can't overrule its blocks"),
    ("CMO can't overrule legal blocks", "skills/cmo/SKILL.md", r"you can't overrule its blocks"),
    ("CLO reports to the CEO", P, r"the CTO, CMO, CLO, and CPO report\s+to the CEO"),
    ("CLO can lead a workstream", P, r"\(CTO, CMO, CLO, or CPO\)"),
    ("Legal exposure never goes public", P, r"Security issues and legal exposure never go public"),
    ("Legal: not legal advice", R + "legal.md", r"Legal analysis, not legal advice"),
    ("Legal: jurisdictions from config, else a question", R + "legal.md", r"`jurisdictions` in `~/\.sdlc/settings\.json`.*raise\s+it as a high inbox question"),
    ("Legal: primary sources with dates; never from memory", R + "legal.md", r"primary sources first.*never rely on\s+memory"),
    ("Legal: may block on high findings; risk acceptance is the human's", R + "legal.md", r"may block a delivery with an unresolved high\s+finding.*critical inbox question"),
    ("Legal: findings private, public tickets neutral", R + "legal.md", r"never a public issue, PR, or comment"),
    ("Legal: when a licensed attorney is needed", R + "legal.md", r"## 4\. When a licensed attorney is needed"),
    ("Legal tree never commits", "skills/clo/SKILL.md", r"never\s+change repository files"),
    ("compliance reminder: no repo changes", "skills/compliance/SKILL.md", r"never change repository files"),
    ("privacy reminder: no repo changes", "skills/privacy/SKILL.md", r"never change repository files"),
    ("ip reminder: no repo changes", "skills/ip/SKILL.md", r"never change repository files"),
    ("CLO: never drafts replies to legal demands", "skills/clo/SKILL.md", r"Never draft a reply to a legal demand"),
    ("Privacy: data minimization", "skills/privacy/SKILL.md", r"Data minimization first"),
    ("Privacy: Security protects, Privacy decides collection and use", "skills/privacy/SKILL.md", r"Security Engineer owns technical protection"),
    ("IP: owns license audits", "skills/ip/SKILL.md", r"\*\*License audit:\*\*"),
    ("IP: read the actual license text", "skills/ip/SKILL.md", r"Read the actual license text"),
    ("Compliance: name the specific rule", "skills/compliance/SKILL.md", r"Name the specific rule and section"),
    ("Security hands license compatibility to IP Counsel", "skills/security/SKILL.md", r"License compatibility belongs to IP Counsel"),
    ("Dependency approvals include the license check", R + "approvals.md", r"its license and\s+whether IP Counsel found it compatible"),
    ("CTO routes legal work", "skills/cto/SKILL.md", r"IP Counsel; personal data\s+→ Privacy Counsel"),
    ("CMO routes claims to CLO", "skills/cmo/SKILL.md", r"get a CLO review"),
    ("Community routes legal notices privately", "skills/community/SKILL.md", r"legal notices such as\s+takedowns"),
    ("Settings template: jurisdictions", "settings.example.json", r'"jurisdictions": \[\]'),
    ("Repo profile: legal and compliance section", R + "repo-profile.md", r"\*\*Legal and compliance:\*\*"),
    # Stop, resume, transfer
    ("stop is human-only", "skills/stop/SKILL.md", r"disable-model-invocation: true"),
    ("resume is human-only", "skills/resume/SKILL.md", r"disable-model-invocation: true"),
    ("transfer is human-only", "skills/transfer/SKILL.md", r"disable-model-invocation: true"),
    ("Stop reaches agents by SendMessage to recorded IDs", "skills/stop/SKILL.md", r"`SendMessage` to the agent ID\s+in `job\.md`"),
    ("Leads pass the stop to their workers", R + "stopping.md", r"lead messages each of its workers by agent ID"),
    ("Safe stop: finish current step, start nothing new", R + "stopping.md", r"Finish the step you\'re on,\*\* and start nothing new"),
    ("Stop commits and pushes WIP to own branch", R + "stopping.md", r"Commit and push\*\* work in progress to your own branch"),
    ("Stop halts processes, keeps worktree, slot, claim", R + "stopping.md", r"Stop\*\* your processes.*Keep your worktree, branch, databases, slot, and ticket claim"),
    ("Stopped tasks write Resume from", R + "stopping.md", r"Write a Resume from\*\* section"),
    # Setup
    ("setup is human-only", "skills/setup/SKILL.md", r"disable-model-invocation: true"),
    ("setup sets up new projects or adopts an existing repository or Project", "skills/setup/SKILL.md", r"\*\*new\*\* project.*\*\*adopts\*\* them"),
    ("setup gives every question a recommendation", "skills/setup/SKILL.md", r"give \*\*every question a recommendation\*\*"),
    ("setup warns without gh or a GitHub account", "skills/setup/SKILL.md", r"\*\*warn\*\* plainly.*no `gh` and no other GitHub connection.*no GitHub account"),
    ("setup recommends a browser for what gh can't do", "skills/setup/SKILL.md", r"If a browser is available, recommend\s+doing them in it"),
    ("setup never handles passwords or private keys", "skills/setup/SKILL.md", r"Never\s+type a password.*Never download, open,\s+read, or paste a private key"),
    ("setup applies only the plan the human confirmed", "skills/setup/SKILL.md", r"Applying is the human's approval of each action the plan lists, and nothing\s+more"),
    ("setup pushes the first commit before any protection, only when new", "skills/setup/SKILL.md", r"the one direct push, made\s+before any protection exists, and only in a new, empty repository"),
    ("setup's files go to the Release Engineer", "skills/setup/SKILL.md", r"dispatch the Release Engineer"),
    ("setup adoption keeps the human's choices", "skills/setup/SKILL.md", r"Never recommend removing or renaming the human's labels"),
    ("setup staffs a team that seeds the backlog through the CEO", "skills/setup/SKILL.md", r"Load `sdlc:ceo` and conduct.*Tickets only: no implementation"),
    ("setup pins at the newest release a week old, never from memory", "skills/setup/references/workflows.md", r"at least 7\s+days old.*Never copy a SHA or digest from memory"),
    ("CEO recommends setup for a project with none, except in setup's own job", "skills/ceo/SKILL.md", r"recommend\s+`/sdlc:setup`, which they run themselves\. A job `/sdlc:setup` started has had\s+its fit check"),
    ("setup resumes an unfinished setup, and pending steps alone", "skills/setup/SKILL.md", r"look for an unfinished setup.*resumes by applying those alone.*`done` only when no step is\s+`pending`"),
    ("setup may write a project's files itself", P, r"apart from the human-run `/sdlc:setup` writing\s+a project's setup files"),
    ("setup lists an organization only when the human administers it", "skills/setup/SKILL.md", r"Recommend adding the\s+organization \(`owned\.organizations`\)\s+only when the human administers it"),
    ("setup scans what git holds before pushing, and new history before its first commit", "skills/setup/references/github-setup.md", r"\*\*The scan\*\* checks exactly what git holds, never the working folder.*\*\*before the first\s+commit\*\*"),
    ("setup checks admin:org for organization types and fields", "skills/setup/SKILL.md", r"`admin:org`\s+for an organization whose issue types or fields setup may create"),
    ("setup writes files itself when the Release Engineer's worktree can't reach the clone", "skills/setup/SKILL.md", r"worktree can't reach the clone, so write the files\s+yourself"),
    ("setup adoption merges rulesets and sends only changed settings", "skills/setup/references/github-setup.md", r"send only the keys\s+the plan changes.*merged, not\s+replaced"),
    ("Issue chooser config is config.yml", "skills/setup/references/scaffold.md", r"`config\.yml` \(GitHub reads only that name"),
    ("setup always sets up the board's workflows", "skills/setup/SKILL.md", r"The board's workflows are part of every setup with a board"),
    ("setup's views sort by Priority by default", "skills/setup/references/github-setup.md", r"Every view sorts\s+by Priority, ascending"),
    ("Resume via SendMessage, else fresh worker from report", "skills/resume/SKILL.md", r"fresh worker with the original brief plus its report\'s \*\*Resume from\*\*"),
    ("stop now: TaskStop, mark interrupted", "skills/stop/SKILL.md", r"`TaskStop` every agent you dispatched.*mark their tasks `interrupted`"),
    ("Interrupted tasks reconcile their worktree on resume", R + "stopping.md", r"Resuming an `interrupted` task.*review uncommitted changes against the last commit"),
    ("Stop takes job, ticket, now", "skills/stop/SKILL.md", r"\[job-id \| #ticket\] \[now\]"),
    ("Resume takes job, ticket, fresh", "skills/resume/SKILL.md", r"\[job-id \| #ticket\] \[fresh\]"),
    ("Transfer takes job, ticket, same-machine", "skills/transfer/SKILL.md", r"\[job-id \| #ticket\] \[same-machine\]"),
    ("Transferring one ticket moves it into a new job", "skills/transfer/SKILL.md", r"move its task into a new job"),
    ("same-machine handoff is the minimal two lines", "skills/transfer/SKILL.md", r"With `same-machine`, only the first two lines"),
    ("A stopped job dispatches nothing", R + "stopping.md", r"A stopped job dispatches nothing"),
    ("job.md records agent IDs", R + "templates.md", r"\| Task \| Role \| Agent ID \|"),
    ("Stop scoped to this session's jobs", "skills/stop/SKILL.md", r"this session's jobs, or the job or ticket named"),
    ("Stop never kills unresponsive agents", "skills/stop/SKILL.md", r"report it rather than killing it"),
    ("Resume asks before adopting a job active elsewhere", "skills/resume/SKILL.md", r"ask the\s+human before adopting it"),
    ("Transfer marks the job transferred", "skills/transfer/SKILL.md", r"Mark\*\* each transferred job `transferred`"),
    ("Transfer handoff in chat and a file, standing alone", "skills/transfer/SKILL.md", r"handoff\.md` and show it in chat.*standing alone"),
    ("Protocol: stopped is a lifecycle state", P, r"can be \*\*stopped\*\*"),
    # expert-review behavior
    ("ER defaults: 2 reviewers, 5 rounds", ER, r"\| X \| reviewers per round \| 2 \|.*\| Y \| maximum rounds \| 5 \|"),
    ("ER never silently degrades", ER, r"never silently degrade"),
    ("ER reviewers use the read-only expert-reviewer agent", ER, r"`sdlc:expert-reviewer` agent"),
    ("ER reviewers verify behavior against sources online", ER, r"Verify, don't assume.*WebSearch, WebFetch.*cite the source"),
    ("ER reviewers may read linked issues and PRs", ER, r"read them with `gh issue view` or `gh pr view`"),
    ("ER waits for every reviewer before finishing", ER, r"never finish your own turn while reviewers are still running"),
    ("ER ticket is not under review", ER, r"not itself up for review"),
    ("ER green-button example", ER, r"button A should be green"),
    ("ER reviewers never edit", ER, r"Do not edit any code"),
    ("ER at most 15 findings", ER, r"at most 15 findings"),
    ("ER redundant comments are Low", ER, r"stale or redundant\s+comment"),
    ("ER completion: >75% approve, no High or Critical", ER, r"more than 75%"),
    ("ER same reviewers across rounds", ER, r"\*\*the same\s+reviewers\*\*"),
    ("ER gives up honestly after Y rounds", ER, r"did not converge"),
]

# Removed features must not return. (decision, file glob, regex)
FORBIDDEN = [
    ("Usage-limit management removed", "**/*", r"usage_limits|usage\.json|five-hour|usage guard|SDLC_USAGE"),
    ("Question modes removed", "**/*", r"question_mode|follow-ups mode|`automated`"),
    ("Work day removed", "**/*", r"work day"),
    ("Dependency-avoidance bias removed", "**/*", r"no-new-dependency"),
    ("Agent authorship labels removed", "**/*", r"agent:<role>|agent:pm|agent:qa"),
    ("No plugin hooks or status line", "hooks/**", r"."),
    ("Direct-question phrasing removed", "**/*", r"who asks or decides|conductor asks the human|Reply \"approve\" or \"deny\""),
    ("Sub-conducting renamed to workstream leads", "**/*", r"sub-conduct"),
    ("General Counsel renamed to Chief Legal Officer", "**/*", r"General Counsel|general-counsel|sdlc:counsel"),
    ("Designer split into Brand and Product Designer", "**/*", r"sdlc:designer|`designer`|skills/designer|\bthe Designer\b"),
    ("Enterprise ownership entries removed", "**/*", r"### Enterprises|read:enterprise|sdlc/enterprises|Listed enterprises"),
    ("Pause flags no-push and keep-running removed", "**/*", r"no-push|keep-running"),
    ("Pause renamed to stop", "**/*", r"sdlc:pause|skills/pause|`paused`|chore\(wip\): pause"),
    ("Markdown config replaced by settings.json", "**/*", r"config\.md|config\.example|`- (span|jurisdictions|inbox_threshold):`"),
    ("Outdated no-nesting claim removed", "**/*", r"Execution is flat|plain subagent cannot spawn|Plain subagents can't"),
]


def norm(text):
    return re.sub(r"\s+", " ", text)


def files(pattern):
    paths = glob.glob(os.path.join(ROOT, pattern), recursive=True)
    return [p for p in paths if os.path.isfile(p) and "/tests/" not in p and "/evals/results/" not in p]


def frontmatter(path):
    import yaml  # PyYAML
    m = re.match(r"^---\n(.*?)\n---\n", open(path).read(), re.S)
    return yaml.safe_load(m.group(1)) if m else None


def structural():
    problems = []
    skills = {d for d in os.listdir(os.path.join(ROOT, "skills"))}
    for path in files("skills/*/SKILL.md"):
        try:
            fm = frontmatter(path)
            if not fm or not fm.get("name") or not fm.get("description"):
                problems.append(f"{path}: frontmatter missing name or description")
        except Exception as e:
            problems.append(f"{path}: frontmatter does not parse ({e})")
    try:
        example = json.load(open(os.path.join(ROOT, "settings.example.json")))
        schema = json.load(open(os.path.join(ROOT, "settings.schema.json")))
        version = json.load(open(os.path.join(ROOT, ".claude-plugin/plugin.json")))["version"]
        # release-please moves this URL with the version (release-please-config.json).
        url = f"https://raw.githubusercontent.com/KnobanLabs/sdlc/v{version}/plugins/sdlc/settings.schema.json"
        if example.get("$schema") != url:
            problems.append(f"settings.example.json: $schema must be {url}")
        if set(example) != set(schema["properties"]):
            problems.append("settings.example.json and settings.schema.json must list the same keys")
    except Exception as e:
        problems.append(f"settings checks could not run ({e!r})")
    # Read-only gh commands only: in auto mode an allow rule skips the classifier.
    reads = {"view", "list", "checks", "diff", "status", "watch", "item-list", "field-list", "search"}
    # `gh auth status` can print the token (`--show-token`).
    leaks = {"Bash(gh auth status *)"}
    try:
        rec = json.load(open(os.path.join(ROOT, "claude-settings.recommended.json")))
        for key, entries in rec["autoMode"].items():
            if entries[:1] != ["$defaults"]:
                problems.append(f'claude-settings.recommended.json: autoMode.{key} must start with "$defaults"')
        for rule in rec["permissions"]["allow"]:
            m = re.fullmatch(r"Bash\(gh ([a-z-]+ )*([a-z-]+) \*\)", rule)
            if not m or m.group(2) not in reads or rule in leaks:
                problems.append(f"claude-settings.recommended.json: {rule} is not a read-only gh command")
        if "Edit(~/.sdlc/settings.json)" not in rec["permissions"].get("ask", []):
            problems.append("claude-settings.recommended.json: an edit to ~/.sdlc/settings.json must always ask")
        untitled = [e[:40] for k in rec["autoMode"].values() for e in k if e != "$defaults" and not e.startswith("**")]
        if untitled:
            problems.append(f"claude-settings.recommended.json: entries need a bold title, which the script matches on: {untitled}")
    except Exception as e:
        problems.append(f"recommended settings checks could not run ({e!r})")
    for path in files("agents/*.md"):
        try:
            fm = frontmatter(path)
        except Exception as e:
            problems.append(f"{path}: frontmatter does not parse ({e})"); continue
        name = os.path.basename(path)[:-3]
        if fm.get("name") != name or len(name) < 3:
            problems.append(f"{path}: name must match the file and be 3+ characters")
        if name == "expert-reviewer":
            tools = {t.strip() for t in str(fm.get("tools", "")).split(",") if t.strip()}
            if fm.get("model") != "claude-opus-5-5" or fm.get("effort") != "high":
                problems.append(f"{path}: reviewers are pinned to claude-opus-5-5 at effort high")
            if not tools or tools & {"Agent", "Task", "Edit", "Write", "NotebookEdit"}:
                problems.append(f"{path}: reviewer must list tools, with no edit or spawn tools")
            if not {"WebFetch", "WebSearch"} <= tools:
                problems.append(f"{path}: reviewer needs WebFetch and WebSearch to verify against sources")
        elif fm.get("model") != "inherit" or "effort" in fm:
            problems.append(f"{path}: must use model: inherit and omit effort")
        for s in fm.get("skills", []):
            if s.split(":")[-1] not in skills:
                problems.append(f"{path}: loads missing skill {s}")
    table = set(re.findall(r"^\|[^|]+\| `[a-z-]+` \| `([a-z-]+)` \|", open(os.path.join(ROOT, P)).read(), re.M))
    agents = {os.path.basename(f)[:-3] for f in files("agents/*.md")} - {"expert-reviewer"}
    for name in sorted(table - agents):
        problems.append(f"protocol org table lists agent {name} with no agents/{name}.md")
    for name in sorted(agents - table):
        problems.append(f"agents/{name}.md is missing from the protocol org table")
    local = {"profile.md", "exploration-log.md", "job.md", "ledger.md", "inbox.md", "standards.md", "risk-register.md", "owner.md", "setup.md", "brief.md"}
    for path in files("skills/**/*.md"):
        # A skill may keep references of its own, beside the protocol's.
        here = os.path.dirname(path)
        own = here if os.path.basename(here) == "references" else os.path.join(here, "references")
        for ref in re.findall(r"`(?:references/)?([a-z-]+\.md)`", open(path).read()):
            if ref not in local and not any(os.path.exists(os.path.join(d, ref)) for d in (os.path.join(ROOT, R), own)):
                problems.append(f"{path}: references missing file {ref}")
    return problems


# Context budgets (tokens, estimated at 3.7 characters each). Raise only on purpose.
BUDGETS = {"always_on_descriptions": 3800}
FILE_BUDGETS = {  # files loaded by most agents or every conductor, about 5% headroom
    P: 4300,
    R + "github.md": 2000,
    R + "workspace.md": 1440,
    R + "templates.md": 1300,
    R + "conducting.md": 2200,
    R + "approvals.md": 1250,
    R + "stopping.md": 400,
}


def budgets():
    problems = []
    est = lambda text: round(len(text) / 3.7)
    for rel, limit in FILE_BUDGETS.items():
        size = est(open(os.path.join(ROOT, rel)).read())
        if size > limit:
            problems.append(f"BUDGET: {rel} is ~{size} tokens (limit {limit})")
    listing = 0
    for path in files("skills/*/SKILL.md") + files("agents/*.md"):
        fm = frontmatter(path) or {}
        if fm.get("disable-model-invocation"):
            continue
        listing += est(str(fm.get("description", ""))) + 9
    if listing > BUDGETS["always_on_descriptions"]:
        problems.append(f"BUDGET: always-on descriptions are ~{listing} tokens (limit {BUDGETS['always_on_descriptions']})")
    return problems


def main():
    failures = structural() + budgets()
    for decision, pattern, rx in RULES:
        targets = files(pattern)
        if not any(re.search(rx, norm(open(p).read()), re.I | re.S) for p in targets):
            failures.append(f"MISSING: {decision}  [{pattern}]")
    for decision, pattern, rx in FORBIDDEN:
        for p in files(pattern):
            if p.endswith((".md", ".json", ".py")) or pattern.startswith("hooks"):
                if re.search(rx, norm(open(p, errors="ignore").read()), re.I):
                    failures.append(f"RETURNED: {decision}  [{os.path.relpath(p, ROOT)}]")
    for f in failures:
        print(f)
    print(f"{len(RULES)} decisions, {len(FORBIDDEN)} removals, structure: "
          f"{'all checks passed' if not failures else f'{len(failures)} failure(s)'}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
