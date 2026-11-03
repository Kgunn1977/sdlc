# sdlc

A Claude Code plugin that runs software and marketing work on any GitHub
repository through an org of agent roles. You set the agenda; a conductor staffs
the smallest team that can do the job.

## Quick start

1. Install the plugin from the KnobanLabs marketplace, in a Claude Code session:

   ```
   /plugin marketplace add KnobanLabs/sdlc
   /plugin install sdlc@KnobanLabs
   ```

2. Copy `settings.example.json` to `~/.sdlc/settings.json` and list the
   users, organizations, and repositories that count as yours
   ([Settings](#settings)).
3. Turn off Claude Code's own attribution in `~/.claude/settings.json`:

   ```json
   { "attribution": { "commit": "", "pr": "" } }
   ```

4. Have `gh` 2.99+ authenticated, with the `project` scope if you use GitHub
   Projects (`gh auth refresh -s project`), and (for UI work) a browser MCP such
   as Chrome DevTools configured.
5. Keep Claude Code's subagent nesting on (the default). Workers spawn their own
   reviewers, which needs `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` of at least 2;
   workstream leads need 3 (the default). Conductors check this and
   `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` at job start and tell you if either is
   too low.
6. Running in auto mode? Adopt the recommended auto mode settings
   ([Auto mode](#auto-mode)), so the classifier doesn't refuse the routine
   GitHub writes of your own tickets.
7. Starting a project, or bringing an existing repository or GitHub Project in
   line? Run `/sdlc:setup`. It asks what you want to build and how, recommends
   an answer to every setup question, and then creates or adjusts the
   repository, its settings and protections, and a Project board with its
   fields, views, and workflows. A team you choose then seeds the backlog.
8. Ask for work: "Engineer, fix #57", "QA, find bugs", "CEO, work tickets #12
   to #18 and QA the app". A role invoked without a task asks what to work on.

## Settings

Every role reads `~/.sdlc/settings.json`. Start from `settings.example.json`;
a key you leave out takes its default. Its `$schema` line points your editor at
`settings.schema.json` as of that release, for completion, descriptions, and
checks as you type; after updating the plugin, change its tag to the new
version so keys added since are recognized. A filled-in file:

```json
{
  "owned": {
    "users": [{ "name": "my-second-account", "host": "github.com" }],
    "organizations": [{ "name": "my-org", "host": "github.com" }],
    "repositories": [{ "name": "some-org/shared-tooling", "host": "github.com" }]
  },
  "jurisdictions": ["US-ID", "EU"],
  "inbox_threshold": "high",
  "span": 8,
  "standing_orders": ["Write user docs in British English."]
}
```

| Key | Default | What it sets |
|---|---|---|
| `owned` | Your own account only | Repositories owned by these users and organizations, and the repositories listed, count as yours: writes there need no approval, except dangerous operations and new dependencies and tools. Each entry needs its `host` (`github.com` or an Enterprise Server host). Enterprises can't be listed |
| `jurisdictions` | None: the legal tree asks first | Where legal and compliance analysis applies, as countries or states |
| `inbox_threshold` | `high` | Questions at or above this priority (`low`, `medium`, `high`, `critical`) wait in the inbox for you; below it, conductors decide and report. Critical questions, including every approval, always come to you |
| `span` | `8` | Tasks one conductor coordinates directly per run. Larger jobs split into workstreams of at most this many tasks, each under a workstream lead |
| `standing_orders` | None | Instructions every role follows, one string each |

If the file doesn't parse, nothing counts as yours until you fix it, and the
roles say so.

## Auto mode

In Claude Code's auto mode a classifier judges each action, and a job's
workers inherit that mode. Its built-in rules **Unrequested Commit in a
Connected App** and **External System Writes** clear a GitHub write only when
the user's own message names it, and a worker's transcript never shows your
messages. So routine ticket writes (`gh pr ready` after a draft-first review,
`gh pr edit`, issue comments) are refused and come back as critical inbox
approvals, and approving one in the conversation doesn't clear it for the
worker. `claude-settings.recommended.json` is a recommended part of
`~/.claude/settings.json` that authorizes those writes in your own repositories,
within limits, and adds guardrails of its own:

- **Environment:** the agent org, its job files and branch conventions; your
  accounts and their public repositories, both generated from
  `~/.sdlc/settings.json`; what Repository notes are; and that branches from
  forks, outside contributors and bots stay untrusted.
- **Allow:** one exception for the ticket workflow's writes on the job's own PRs
  and issues (create, edit, mark ready, comment, resolve a thread it replied to
  with the fix, set fields, rerun the job's failed CI jobs, and queue a PR where a
  merge queue or required checks gate the default branch), and one for removing
  an accepted task's scratch folders and worktrees. The classifier sees
  messages and commands but never their output, so a PR counts as the job's
  only when the transcript shows it: created there, named by you or in a launch
  prompt, or named by its job branch. Release and bot PRs, `--admin`,
  approving reviews, and closing issues other than through a merged PR stay
  excluded.
- **Soft deny:** five rules the defaults don't have: a direct push to a default
  branch, a force-push to a branch that isn't the job's, merging or queueing a
  release or bot PR, repository administration, and a new dependency or tool.
  Each says what clears it.
- **Permissions:** read-only `gh` commands; `~/.sdlc` and `/tmp/sdlc` as
  additional directories, so agents write job files without prompts; and an
  `ask` rule so an edit to `~/.sdlc/settings.json`, which says what you own,
  always asks you. It allows no `gh` write: in auto mode a matching
  allow rule is resolved before the classifier runs, so `Bash(gh pr merge *)`
  or `Bash(gh api *)` would skip every guard above.

Every `autoMode` list in the file keeps `"$defaults"`, so the built-in rules
stay in force.
Claude Code reads `autoMode` only from your user settings, managed settings, or
`--settings`, never from a project's `.claude/settings.json`, so these are
per user.

**Adopt them** by running the script yourself, in a terminal or with `!` in a
session: auto mode treats an agent editing your Claude Code settings as
Self-Modification, which a go-ahead in the conversation doesn't reliably clear. The marketplace clone that
`/plugin marketplace add` made has it:

```bash
python3 ~/.claude/plugins/marketplaces/KnobanLabs/scripts/automode-settings.py merge          # shows what would change
python3 ~/.claude/plugins/marketplaces/KnobanLabs/scripts/automode-settings.py merge --write  # saves it, after a dated backup
```

It needs Python 3 and an authenticated `gh`. It changes only its own entries,
matched by their bold titles, and keeps every other key and entry. It warns
about an allowed `gh` write rule and about an `autoMode` list without
`"$defaults"`, but changes neither. Run `merge` again after an update to bring its
entries up to date; it replaces them, so keep changes of your own in separate
entries.

**Repository notes** state what only you know: for each repository whose
default branch a merge queue or ruleset with required checks gates, add an
entry to `autoMode.environment` yourself, such as:

```text
**Repository notes, <owner>/<repo>**: <branch> is the default branch, gated by <a merge queue | a ruleset> with required checks (<check names>); it requires <no | N> approving reviews. Merging to <branch> deploys <nothing | <target>>. Production deploys are: <merging the release PR, `gh release create`, pushing a `v*` tag, `gh workflow run` on <workflow>>.
```

Without notes a repository gets no merge waiver, so queueing its PRs still asks.

**Add an organization** by listing it under `owned` in `~/.sdlc/settings.json`
and running `automode-settings.py sync --write`, which rewrites only the owned
accounts and their public repositories. Run it again after creating a repository
or making one public.

**Check them** with `claude auto-mode config` (the rules in effect, defaults
included), `claude auto-mode critique` (a review of your own rules), and
`automode-settings.py list` (your owned accounts, and whether each recommended
entry is current, outdated, or missing).

## The org

| Tree | Roles (skill) |
|---|---|
| Leadership | CEO (`ceo`) |
| Technology, under the CTO (`cto`) | Architect, Engineer, QA, Security, Release (`architect`, `engineer`, `qa`, `security`, `release`) |
| Marketing, under the CMO (`cmo`) | Brand Designer, Content Writer, Community (`brand-designer`, `writer`, `community`) |
| Legal, under the Chief Legal Officer (`clo`) | Compliance Officer, Privacy Counsel, IP Counsel (`compliance`, `privacy`, `ip`) |
| Product, under the Chief Product Officer (`cpo`) | PM, Data Analyst, Product Designer (`pm`, `analyst`, `product-designer`) |

Skills are invoked as `/sdlc:<skill>`. Any role invoked directly runs its own job.
`/sdlc:setup [owner/repo] [project]` sets up a new project, or adopts an
existing repository or Project; `/sdlc:accept <tasks>` records your acceptance
and cleans up; `/sdlc:inbox` answers waiting questions; `/sdlc:expert-review`
reviews any change.
`/sdlc:stop` brings every agent to a safe stop (finishing its current step,
committing and pushing work in progress, stopping its processes);
`/sdlc:resume` continues from there, in this session or a new one; and
`/sdlc:transfer` stops the work and gives you a prompt that picks it up in a
new session.

## What to expect

- **Inbox:** questions wait in an inbox instead of interrupting you, one per
  job; `/sdlc:inbox` asks only the current session's questions, so two sessions
  running side by side never mix them. A
  conductor asks you directly only what to work on (when you give it no task)
  and fit checks (when you've picked the wrong entry point). Run
  `/sdlc:inbox` (or say "ask your questions now") to hear the decisions made on
  your behalf and answer what's waiting. Questions below your threshold
  (`/sdlc:inbox medium`, a "threshold: medium" in your request, or
  `inbox_threshold` in settings; default `high`) are decided by the conductor.
  Critical questions, including every approval, always wait for you rather than
  being decided. Work that depends on an answer waits;
  everything else continues. When nothing else can proceed, the conductor stops
  and tells you how many questions are waiting.
- **Approvals:** in your repos, agents act within their roles; dangerous,
  destructive, or irreversible operations, new dependencies and tools, and any
  write elsewhere, wait for you.
- **Tickets:** whichever role picks up a ticket assigns it to you and keeps its
  status current (Todo, In Progress, In Review, Done), whether or not the work
  touches code. Work needing several roles is split into sub-issues, one per role.
  When the repo has a related GitHub Project, every ticket the org files or
  triages goes into it with every field populated.
- **Acceptance:** nothing is cleaned up until you accept it ("accept #57").
  Merges may happen earlier when checks and review pass.
- **Only the technology tree commits.** Other roles keep work in
  `~/.sdlc/<owner>/<repo>/` and hand repo changes over.
- **Legal and compliance** work is informational analysis, not legal advice.
  It names its jurisdictions (`jurisdictions` in settings), cites dated
  sources, keeps exposure private, says when you need a licensed attorney, and
  can block a delivery on a high-risk finding until you fix it or accept the
  risk. License audits belong to IP Counsel, not Security.
- **No attribution:** agents write as you, and never post to social platforms
  (they draft; you post).
- **Every repo change** passes `sdlc:expert-review`; UI PRs include before and
  after screenshots unless the repo's guidance says otherwise.
- **Model and effort** follow your session, except expert-review's reviewers,
  which the read-only `expert-reviewer` agent pins to Opus 5.5 at High. Don't add
  `effort` to the other agent files.
- **Large jobs:** a conductor coordinates at most 8 tasks per run directly
  (`span` in settings). Beyond that, the work splits into workstreams, each run
  by a workstream lead (a CTO, CMO, CLO, or CPO in lead mode) that staffs,
  integrates, and, for technical work, merges its slice. The top conductor
  dispatches every lead and keeps cross-workstream integration. Workers return
  a short summary and save full reports to the job folder, keeping each
  conductor's context small.

## Layout

| Path | Contents |
|---|---|
| `skills/protocol/` | The shared protocol every role loads, plus references (conducting, workstreams, stopping, approvals, workspace, GitHub, screenshots, repo profile, legal, design, templates) |
| `skills/<role>/` | Nineteen role skills, plus `accept`, `inbox`, `resume`, `setup`, `stop`, `transfer`, and `expert-review` |
| `skills/setup/references/` | Setup's interview and defaults, its GitHub setup (settings, rulesets, the Project and its views, and the steps that need a browser), and the files it writes |
| `agents/` | Worker definitions for every role except the CEO, plus the read-only `expert-reviewer` |
| `evals/` | Behavior cases for `claude plugin eval`, each run with and without the plugin: routing to each role (tag `smoke`), protocol rules such as fit checks and team planning (`protocol`), and untrusted ticket and comment text (`security`) |
| `tests/check_rules.py` | Verifies every recorded decision is still stated and removed features stay removed. It also enforces token budgets on the files agents load most. Run `python3 tests/check_rules.py` after any edit (needs PyYAML); update its entry when a decision changes, and raise a budget only on purpose |

Local state lives in `~/.sdlc/`: settings, and per-repo profiles and jobs.

## Known gaps

- With nesting off, or an older Claude Code that lacks it, workers can't spawn
  reviewers; conductors then run the rounds and route fixes to a technology
  worker.
- Approval rules are enforced by instructions, not hooks. Plugin agents can't
  limit Bash to specific commands, so the reviewers' read-only Bash use is an
  instruction too (they have no edit or spawn tools, but can read GitHub and
  the web to verify behavior).
- Agent teams are optional and experimental; everything works without them.
