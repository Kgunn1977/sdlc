---
name: setup
description: Set up a project for the SDLC org. Creates a new GitHub repository, its settings, a GitHub Project with views, and a brief, or brings an existing repository or Project in line, then staffs a team that seeds or triages the backlog. Human-invoked only.
disable-model-invocation: true
argument-hint: "[owner/repo] [project number or URL]"
---

# Setup

Set up a project with the human: the repository and its files, its settings
and protections, a GitHub Project to track the work, and a backlog that agents
can work through. Load `sdlc:protocol` first.

**Modes.** With no arguments, in a folder with no git repository and no code,
this is a **new** project. Given a repository (`owner/repo`, or the current
folder's remote), a Project (its number or URL), or both, it **adopts** them:
it compares what exists with the defaults and brings it in line, so SDLC
tickets work there: issue types, Priority, Effort, area labels, Status options,
and views. A folder holding a git repository or code with no GitHub remote is
adopted too, after asking (recommended): the repository is created from it and
its history pushed, after a secret scan (`references/github-setup.md`,
section 2). A Project alone needs the repository its tickets belong
to: recommend the one linked to it, or the one holding most of its items.

**Asking.** This command runs in the human's main session and asks them
directly (protocol section 5). The human may not be technical: use plain
words, one topic at a time, and give **every question a recommendation**, the
first option, marked "(Recommended)", with a one-line reason. Choices go
through AskUserQuestion (at most four questions per call); open questions, such
as what to build, go in prose and wait for the reply. Never ask what you can
look up (`gh`, `git`, the files); state what you found instead.

**Defaults.** The setup is complete and opinionated by default
(`references/interview.md`, Defaults). Each answer keeps a default or moves
away from it, and the plan says which, and why.

**Resuming.** Before anything else, look for an unfinished setup:
`~/.sdlc/*/*/jobs/*/setup.md` whose status isn't `done`. One for this folder or
the repository named is offered first, as the recommended choice. Others are
listed after it, unrecommended, leaving out any whose only unfinished steps
are still waiting. `setup.md` records every answer, the plan, and each step's
state, and every step checks what already exists before changing anything. A
setup whose only unfinished steps are `pending` (a ruleset waiting on a merge)
resumes by applying those alone, once what they wait for is done: no
interview, plan, or seeding again. A setup is `done` only when no step is
`pending`.

## 1. Preflight

Check, changing nothing: `gh --version` (2.99+), `gh auth status` (signed in,
with the `repo`, `workflow`, `read:org`, and `project` scopes, and `admin:org`
for an organization whose issue types or fields setup may create), `git
--version` with `user.name` and `user.email` set, `docker info` (optional, for
the secret scan hook), any other GitHub connection (a GitHub MCP server or
connector), a browser the session can drive (Claude in Chrome,
`mcp__claude-in-chrome__*`, or the desktop app's built-in browser,
`mcp__Claude_Browser__*`, or their enable tools), and the current folder:
empty, an existing repository with or without a GitHub remote, or other
content (a new project goes in a new subfolder).

Report what's ready in a short list, and **warn** plainly when:

- **There's no `gh` and no other GitHub connection,** or it's signed out:
  nothing can be created or changed on GitHub for them. Recommend installing
  `gh` (`brew install gh`, `winget install GitHub.cli`, or
  https://cli.github.com; a new tool, so ask), then having them run
  `! gh auth login` themselves. Offer the alternatives: the browser for the
  GitHub steps, or the files locally now and GitHub later.
- **They have no GitHub account:** recommend creating one at
  https://github.com/signup, and an organization for a company. A browser can
  guide them, but they type their own password and codes.
- **A scope is missing:** they run `! gh auth refresh -s <the missing scopes>`
  (such as `project,workflow,admin:org`). Never change credentials yourself.
- **No browser tools are available:** recommend Claude in Chrome or the Claude
  desktop app's built-in browser for the steps `gh` can't do (section 6).
  Without one, those steps become instructions for the human.

Continue with whatever works; a missing piece narrows the plan, it doesn't end
the command.

## 2. The project

**New:** ask in prose, and invite as much or as little detail as they like:

1. **What do you want to build, and who is it for?** What problem does it solve
   for them?
2. **How do you want to build it?** A website or web app, mobile, desktop,
   command line, an API or service, or a library; languages, frameworks, or
   services they want or must use; where it runs. "Not sure" is a good answer:
   the Architect will recommend a stack.
3. **What must the first version do, and what can wait?** Any date that matters?

**Adopt:** read the README, the guidance files, the stack, and the open issues
first. Draft the brief from them, then ask only what they don't say: who it's
for, and what comes next.

Follow up only on what's unclear. Then read back a short summary (the pitch,
its users, platforms, stack or "the Architect recommends one", the next
version, and anything out of scope) and confirm it. This is the brief.

## 3. Audit and questions

**Adopt:** audit the repository, the Project, or both against the defaults,
reading only (`references/github-setup.md`, section 10). The result is a gap
list: each item is **in line**, **missing**, or **different**. What the
repository or Project already does is a choice made, so recommend keeping it
unless it stops SDLC tickets from working, and say what each change gives.
Never recommend removing or renaming the human's labels, fields, options,
views, files, settings, rules, or workflows; at most offer to, as separate
choices.

Then work through `references/interview.md` in its order. Skip a question that
the brief, the account, the audit, or an earlier answer already settles, and
say what you took. Ask only the questions it marks as asked; the rest are plan
defaults the human can change at the plan.

Once the owner and name are settled, start the job: create its folder with
`job.md`, `ledger.md`, `inbox.md`, and `reports/` per `conducting.md` (Start,
step 7), save every answer and the audit to `jobs/<job-id>/setup.md` with each
step's state, and write the brief, in the human's words, to
`~/.sdlc/<owner>/<repo>/product/brief.md`.

## 4. The plan

Show one plan before changing anything: a table per area (repository, files,
settings and protections, security, automation, Project), each row giving
what will be created or set, its value, and "default", "kept as it is", or why
it differs. Then list:

- **Ownership:** a repository owned by an organization that
  `~/.sdlc/settings.json` doesn't list is external (`approvals.md`, section 1),
  so every later write would ask for approval. Recommend adding the
  organization (`owned.organizations`) only when the human administers it
  (`gh api user/memberships/orgs/<org> --jq .role` is `admin`) or created it in
  this setup, since that makes every repository in it their own. Otherwise
  recommend listing just this repository (`owned.repositories`). Declining
  both keeps it external.
- **Approvals:** every action `approvals.md` treats as dangerous, irreversible,
  or a settings change: creating the repository at its visibility, the first
  commit pushed straight to the default branch (the one direct push, made
  before any protection exists, and only in a new, empty repository), pushing
  an existing local history, repository and security settings, rulesets,
  labels removed, environments, secrets, organization-wide issue fields or
  types, and fields, options, or views changed on an existing Project.
- **What GitHub may refuse** on the owner's plan, and the fallback
  (`references/github-setup.md`, section 1). When the plan can't be read,
  say it's unknown.
- **What needs the browser or the human** (section 6).

Ask: **Apply the plan** (Recommended), **Change something**, or **Cancel**.
Applying is the human's approval of each action the plan lists, and nothing
more: anything that comes up later is asked again.

## 5. Apply

In order, skipping what the audit found in line, recording each step's state
in `setup.md` and everything created in the ledger (`workspace.md`). When
GitHub refuses a step, take the fallback in `references/github-setup.md`, tell
the human what's missing and why, and record what the later steps must do
instead (Project fields rather than issue fields, no merge queue, and so on).

1. **Ownership:** add the organization or the repository, with its host, to
   `owned` in `~/.sdlc/settings.json`, as planned, leaving it valid JSON. If
   it's missing, start it from the plugin's `settings.example.json` (two
   folders above this skill's), which carries the `$schema` line.
2. **Repository:** create it and clone it, or use the existing one
   (`references/github-setup.md`, section 2).
3. **Issue types and fields** for an organization: section 7, before any file
   is written, so the files describe what exists.
4. **Files**, from `references/scaffold.md` and `references/workflows.md`,
   with the answers, `setup.md`, and the brief:
   - **When this session started inside the repository** (it was already a git
     repository when the session began, and is the one adopted), dispatch the Release Engineer (`sdlc:release-engineer`) with a
     brief (`templates.md`) holding those, with the references' absolute
     paths. The files arrive in a pull request like any other change, never
     overwriting a file without the plan saying so; each conflict comes back
     as a question.
   - **Otherwise** (a new project, a clone made in this session, or a folder
     that became a git repository in it), the
     Release Engineer's worktree can't reach the clone, so write the files
     yourself, following the same references, and run `sdlc:expert-review`
     with the clone's path as its target. In a new, empty repository, push the
     first commit (`chore: initialize the repository`) to the default branch;
     in an existing one, open a pull request.
   - **A Project alone** has no files.
5. **Settings, security, labels, rulesets, and environments:**
   `references/github-setup.md`, sections 3 to 7. A branch ruleset that
   requires checks the files' pull request adds waits until it merges: mark it
   `pending` in `setup.md`. Running `/sdlc:setup` again after the merge applies
   it, and nothing else.
6. **The Project,** its fields, views, and README: section 8.
7. **The repo profile:** write its sections 1 to 4 (`repo-profile.md`),
   recording the Project.

## 6. What `gh` can't do

`gh` and the API can't turn on a Project's built-in workflows, create or install
a GitHub App, or accept billing; `references/github-setup.md`, section 9, gives
each step. **The board's workflows are part of every setup with a board,**
since they move tickets through their Status; never leave them out. List the
remaining steps. **If a browser is available, recommend
doing them in it** and load its skill first: Claude in Chrome
(`anthropic-skills:chrome-browser`) or the built-in browser
(`anthropic-skills:built-in-browser`). Without one, give numbered steps with
links.

The human stays in control in the browser. They sign in themselves. Never
type a password, a two-factor code, or payment details. Never download, open,
read, or paste a private key: the human generates it, sets the secret with the
command you give them (`! gh secret set NAME -R <owner>/<repo> < key.pem`),
and deletes the file.

Whatever is still left becomes one Task issue, "Finish setting up `<name>`",
with a checklist, assigned to the human, at Status **Blocked by Human**. A
pending ruleset is on it: "Once #N merges, run `/sdlc:setup` again to protect
`<branch>`".

## 7. Staff the team

**A session in the repository.** The seeding job's technology roles work in
worktrees of the repository this session started in. When it started
elsewhere, or the repository didn't exist yet when it started (a new project, a
clone made in this session, or a folder that became a git repository in it),
mark the setup
`seeding` in `setup.md` and have the human start Claude Code in the clone
(`cd <folder> && claude`) and run `/sdlc:setup` there. It resumes here.

From the brief, recommend which roles take part and why
(`references/interview.md`, Team). The CPO, PM, and Architect always do. Ask
with AskUserQuestion, multiSelect, one option per tree, marking the
recommended ones. Then record the team in the brief.

## 8. Seed or triage the backlog

Load `sdlc:ceo` and conduct this job: its folder exists, so skip `conducting.md`
Start step 7, and the fit check is settled because `/sdlc:setup` started it.
The goal is "Seed `<name>`'s backlog from its brief", with the team chosen.
**Adopt** adds, when open issues exist and the human agrees (recommended),
"and bring its open issues in line": the PM triages each one, setting its type,
every field, an area label, and a milestone, adds it to the Project, and maps
its Status by meaning (`github.md`, section 9). It changes no issue's scope or
text beyond that, and files new tickets only where the brief has gaps the
existing ones don't cover.

Tickets only: no implementation in this job. Each deliverable has its owner:

- **CPO:** the strategy (`product/strategy.md`), and a roadmap whose first
  milestone is the next version, created as the repository's milestones
  (existing milestones kept).
- **Architect:** for a new project, the stack, recommended with the options
  weighed (a proposed ADR, through a pull request); the architecture overview;
  and the foundation tickets: the skeleton, the toolchain's checks in CI,
  tests, and deployment.
- **PM:** the feature tickets for each milestone, with a problem, numbered
  acceptance criteria, and sub-issues for multi-role work; and the triage.
- **The rest of the team:** a ticket for each piece of work it owns, such as the
  design system and key screens (Product Designer), the threat model (Security),
  release and deployment (Release), the test strategy (QA), success metrics
  (Data Analyst), positioning and launch (CMO), and the privacy policy, terms,
  compliance, or name clearance (legal tree).

Every ticket goes into the Project with every field set (`github.md`, sections
3 and 9), Status Todo. Each `TODO(setup)` the brief couldn't fill becomes a
ticket too. Because the human is right here, when the job stops on questions,
offer to answer them now (an inbox check, as `/sdlc:inbox` runs it). When the
job closes, mark the setup `done`, or `pending` while a step still waits.

## 9. Report

Report briefly:

- The repository and Project links.
- What differs from the defaults, and why; for adoption, what was brought in
  line and what was kept.
- What's left for the human, with its issue, including any pending ruleset and
  `scripts/install-hooks.sh` for the secret scan.
- The backlog: milestones, tickets per milestone, and issues triaged.
- How to continue: "CEO, work milestone 1", then `/sdlc:accept`.
