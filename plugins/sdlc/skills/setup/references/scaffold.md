# Setup: the repository's files

What `/sdlc:setup` writes, itself or through the Release Engineer (`SKILL.md`,
section 5, step 4): the governance, docs, agent,
GitHub, and editor files. The CI, hooks, and automation are in
`workflows.md`. Write only what the answers in `setup.md` call for, in the
voice below: plain, specific, and explaining why where it isn't obvious.

## Placeholders

| Placeholder | Value |
|---|---|
| `{{name}}` | The display name ("Recipe Box") |
| `{{repo}}` | `owner/repo` |
| `{{url}}` | `https://github.com/{{repo}}` |
| `{{branch}}` | The default branch; `develop` unless the answers say otherwise. Wherever a file below says `develop`, use it |
| `{{holder}}` | The copyright holder: the company's legal name, or the individual's full name |
| `{{year}}` | The current year |
| `{{handle}}` | The human's GitHub login |
| `{{pitch}}` | The brief's one-paragraph description |
| `{{areas}}` | The area labels: `ci`, `config`, `documentation`, `infra`, and the project's own |

`TODO(setup)` marks what the brief can't fill yet, such as the dev commands
before a stack exists. The seeding job turns each one into a ticket.

## Copyright header

Every config, workflow, and script file that takes comments starts with the
header, in its comment syntax, followed by a blank line: YAML (issue forms
included), shell, and dotfiles such as `.gitignore`. Markdown and JSON take
none.

- **Proprietary:**

  ```
  # Copyright {{year}} {{holder}}. All rights reserved.
  # ({{url}})
  ```

- **Open source:**

  ```
  # Copyright {{year}} {{holder}}
  # SPDX-License-Identifier: <SPDX id, such as MIT>
  # ({{url}})
  ```

`AGENTS.md`'s Copyright header convention states the same form.

## Layout

| Path | Written when |
|---|---|
| `README.md`, `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `LICENSE`, `AUTHORS` | Always |
| `.github/copilot-instructions.md` | Copilot is one of the agents |
| `.agents/skills/.gitkeep` | Always |
| `.mcp.json` | The brief has a user interface |
| `.github/CODEOWNERS`, `.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/labels.json` | Always |
| `.editorconfig`, `.gitattributes`, `.gitignore`, `.vscode/extensions.json`, `.vscode/settings.json` | Always |
| `docs/adr/README.md`, `docs/adr/0000-template.md` | Always |
| Everything in `workflows.md` | As it says |

**Adopting** an existing repository, write a file only where the plan says to.
Merge into what's there (a section added to an existing `CONTRIBUTING.md`, a
line added to `.gitignore`) rather than replacing it, and match the file's
existing voice.

## README.md

```markdown
# {{name}}

{{pitch}}

## Getting Started

TODO(setup): Prerequisites, and the commands that set up, run and test the
project.

Turn on the secret scan before your first commit (it needs Docker):

    scripts/install-hooks.sh

## Contributing

<By invitation: "Contributions are by invitation." Open: "Contributions are
welcome."> See [CONTRIBUTING.md](CONTRIBUTING.md) for the branch, commit and
pull request conventions, and [AGENTS.md](AGENTS.md) for the instructions
coding agents follow.

## Security

Report vulnerabilities privately, as [SECURITY.md](SECURITY.md) describes.

## License

<Proprietary: "Proprietary. Copyright © {{year}} {{holder}}. All rights
reserved."; open source: "<License name>. Copyright © {{year}} {{holder}}.">
See [LICENSE](LICENSE).
```

Use a fenced block for the hook command.

## AGENTS.md

`CLAUDE.md` is the single line `@AGENTS.md`. `.github/copilot-instructions.md`:

```markdown
# GitHub Copilot Instructions — {{name}}

All agent instructions live in [AGENTS.md](../AGENTS.md) at the repository root
— read and follow it. It covers the project overview, dev commands, agent
skills, code conventions, and what to avoid.

Do not duplicate instructions here; update `AGENTS.md` instead.
```

`AGENTS.md`, starting `# {{name}} — Agent Instructions` and the paragraph
"This is the canonical instruction set for all coding agents (Claude Code,
GitHub Copilot, and others). `CLAUDE.md` and `.github/copilot-instructions.md`
defer to this file — make instruction changes here only." Then:

- **Project Overview:** what it is, who uses it, where it runs, and its state
  (a new project), from the brief. Link `docs/adr/`.
- **Dev Commands:** `TODO(setup)`, and the fenced line
  `scripts/install-hooks.sh   # turn on the pre-commit secret scan (needs Docker)`.
- **Agent Skills:** domain instructions live in `.agents/skills/`, one folder
  per skill with a `SKILL.md`; read the relevant one before working in that
  area, and add one when an area outgrows this file. An empty table with the
  columns Skill and When to use.
- **Key Conventions**, as bullets:
  - **Never commit to `develop`:** it is the protected default branch; every
    change goes on a feature branch through a pull request, never pushed or
    force-pushed directly, even for a typo.
  - **Branches** are named `<handle>/<issue#>-<type>-<short-description>`, with
    `none` when there is no issue (`CONTRIBUTING.md`, _Branch Naming_).
  - **Commits and pull request titles** follow Conventional Commits, in the
    imperative and lower case (`fix: stop the retry loop on a 404`). CI rejects
    a title that doesn't conform, and the title becomes the squashed commit on
    `develop` and its changelog line.
  - **Pull requests** fill out every section of the template, replacing each
    `None` that applies and keeping the guidance comments, and list the issues
    they close (`Closes #123`).
  - **CI green and every review thread resolved** before a merge, through the
    merge queue (or auto-merge without one; with no ruleset, merging by hand
    once the checks are green). When a job fails for a reason the
    change can't explain, rerun only the failed jobs, once; a second failure is
    real.
  - **An issue you file or triage gets all four triage fields:** its type, a
    Priority, an Effort, and at least one area label (`CONTRIBUTING.md`,
    _Triaging Issues_).
  - **Architecture decisions are recorded** in `docs/adr/`: read the relevant
    record before changing what it decided. A _Proposed_ record may be edited;
    an _Accepted_ one changes only through a new record that supersedes it.
  - **No new abstractions** beyond what the immediate task requires.
  - **Comments** explain _why_, not _what_, and only where it is non-obvious.
  - **Pin what CI runs:** Actions by commit SHA with the version in a comment,
    images by digest. <Renovate or Dependabot> moves them.
  - **No AI self-attribution** in commits, PRs, issues, or discussions: no
    `Co-Authored-By` model trailers, "Generated with …" footers, or similar.
  - **Copyright header:** every config, workflow, and script file that takes
    comments starts with the header (above), in that file type's comment
    syntax.
- **What to Avoid**, as bullets: committing secrets, tokens, keys, or real
  credentials, even in examples or tests (the hook and CI scan; an
  `.env.example` holds placeholders only); error handling for scenarios that
  can't happen where the code runs; backwards-compatibility shims, data
  migrations, or legacy fallbacks for code being changed, unless an accepted
  record requires one; a new kind of service, cloud product, or vendor that no
  record covers (propose it in a record first); and a workflow with more
  permissions than its job needs (`permissions: {}` at the top, and each job
  asking for what it uses, with a comment saying why).

## CONTRIBUTING.md

`# Contributing to {{name}}`, then an opening that follows the license and
contribution answers. By invitation and proprietary: "{{name}} is a private,
proprietary project (see LICENSE). Contributions are by invitation, and
outside contributions need a written agreement with {{holder}} first."
Open: thank contributors and say how to start (an issue first for anything
large). Then a note for coding agents: `AGENTS.md` is canonical, with
domain detail in `.agents/skills/`, and this guide is the human-facing summary.
Then these sections:

- **Prerequisites:** Git 2.36 or newer; Docker, for the pre-commit secret scan;
  the GitHub CLI, signed in. `TODO(setup)`: the toolchain and the versions it
  pins.
- **Development Setup:** `TODO(setup)`. Then **Secret scan before each commit**:
  the hook scans what a commit stages with the same Trivy image and config
  (`.github/trivy-secret.yaml`) as CI's _Scan for secrets_ step, so a secret is
  stopped before it's committed rather than after it's pushed; turn it on once
  per clone with `scripts/install-hooks.sh`. It copies the staged files to a
  temporary folder inside `.git`, always removed, and runs Trivy with no
  network over the read-only folder. It fails when Docker isn't running rather
  than letting the commit through. `SKIP_SECRET_SCAN=1 git commit …` or
  `--no-verify` skips it, and CI still scans the push; `pre-merge-commit` scans
  git's own merges. Give the whole-tree command, the same `docker run` as
  validate.yaml's step (`workflows.md`), with `/repo` mounted read-only.
- **Branch Naming:** `<handle>/<issue#>-<type>-<short-description>`, with
  examples (`{{handle}}/41-feat-export-csv`, `{{handle}}/none-chore-tidy-gitignore`),
  `none` without an issue, and the types `feat`, `fix`, `docs`, `refactor`,
  `test`, `ci`, and `chore`.
- **Commit Messages:** Conventional Commits, `<type>(<scope>): <short
  description>` with an optional body and footer, and three examples. PR
  titles follow it too, and CI rejects those that don't. A pull request
  squashes to one commit titled by it. With releases: release-please builds
  the changelog and version from those titles, `feat` bumping the minor, `fix`
  the patch, and `!` or a `BREAKING CHANGE:` footer the major.
- **Pull Request Process:** `develop` is protected, so every change lands
  through a pull request. Numbered steps:
  1. Branch from `develop`.
  2. Make the change with every check passing.
  3. Fill out the template, replacing each `None` that applies and keeping the
     comments.
  4. Add before and after screenshots for any UI change.
  5. Open the PR against `develop`; CODEOWNERS requests the reviewers.
  6. Get CI green and resolve every thread. A Copilot code review is welcome
     but optional.
  7. Merge.

  `~PR Preparation` lints the title and labels the PR by its paths, keeping
  the labels in step with the diff, so don't add area labels the paths don't
  explain. The rerun rule: **Re-run failed jobs**, or
  `gh run rerun <run-id> --failed`, once, never **Re-run all jobs**. A job
  that passes on the rerun has a flaky test: open a bug, or add to the one
  open. A second failure is real. First-time contributors may add themselves
  to `AUTHORS`.
- **Merging:** with the merge queue, **Merge when ready** or
  `gh pr merge <branch>` queues a green PR. The queue squashes it onto the
  latest `develop` with the PRs ahead of it, and runs `Validate Branch` again.
  A failure drops the PR from the queue; fix the branch and queue it again,
  since rerunning the failed run doesn't. The branch needn't be up to date. The
  required checks are `validation-outcome` and `pr-lint-title`, and a new job
  joins them through `validation-outcome`'s `needs`, never the ruleset.
  Without the queue: `gh pr merge <branch> --squash --auto`, which merges once
  the same checks pass. Without a ruleset, nothing is required, so auto-merge
  would merge at once: say instead to wait for green checks, then
  `gh pr merge <branch> --squash`.
- **Runners:** CI runs on GitHub's hosted runners. Each job that can move
  reads `RUNNER_LINUX` (`gh variable set RUNNER_LINUX --body <label>`; delete it
  to go back), taking `ubuntu-24.04` when unset, and a queued job keeps the
  runner it asked for. `~Release Please`, `Renovate`, and `~PR Preparation`
  always stay on GitHub's runners, because each holds a token that can write.
  A public repository never uses self-hosted runners, since fork pull requests
  would run on them.
- **Releasing** (with releases): release-please keeps a release PR,
  `chore: release vX.Y.Z`, open on `develop` with the changelog. Merging it,
  through the usual flow, tags `vX.Y.Z` and publishes the release, and the
  `v*` tags are protected. It runs as the release App, so the release PR's
  checks start on their own. The App needs contents, issues, and pull requests
  write, and its `RELEASE_APP_CLIENT_ID` and `RELEASE_APP_PRIVATE_KEY`
  repository secrets; until both are set, the workflow passes with a warning.
  "Allow GitHub Actions to create and approve pull requests" stays off.
  `TODO(setup)`: what a release deploys, if anything.
- **Dependency updates:** Renovate: it runs in the `Renovate` workflow, as a
  second App kept apart from the release one (contents, pull requests, issues,
  workflows, and commit statuses write, metadata read, no webhook). Its
  secrets belong to the `renovate` environment, whose only deployment branch
  is `develop`, so a run from any other branch gets neither. Its global config
  runs none of the repository's code. It runs Mondays at 01:17 UTC, inside the
  00:00 to 06:00 UTC window, and every update waits 7 days. Give
  `gh workflow run renovate.yaml`, with `-f dry-run=true` for a dry run. Add
  each ecosystem to `enabledManagers`. Dependabot instead: it opens grouped
  weekly PRs from `.github/dependabot.yml`, each update waiting 7 days, and the
  images pinned in workflows and the hook are moved by hand. Either way,
  security updates are Dependabot's.
- **Reporting Issues:** the Bug, Feature, and Task forms, and security reports
  through `SECURITY.md`, never an issue. Reporters needn't set priority,
  effort, or area.
- **Triaging Issues:** a maintainer, or an agent working for one, gives each
  new issue a type (Bug, Feature, or Task), a Priority (Urgent blocks the
  current milestone or is broken; High is next up; Medium is planned; Low is
  someday), an Effort, and at least one area label from `{{areas}}`, then
  removes `triage`. A new area goes in `.github/labels.json`,
  `.github/labeler.yaml`, `AREA_LABELS` in `scripts/triage-fields.sh`, and the
  board's Area field. Say where Priority and Effort are set (issue fields, or
  the board). Effort:
  - **Low:** a contained change, a few hours to a day (about 200 hand-written
    lines or fewer).
  - **Medium:** one area over a day to a few days (about 200 to 1,000 lines), or
    a decision or document that needs research.
  - **High:** a week or more, several areas or a new subsystem (over 1,000
    lines), or an epic.

  When refining changes an issue's scope, set its Effort again. With the triage
  check, describe it: the `Triage Fields` workflow labels each open issue
  missing a field `triage` every day, and nothing more. Give
  `gh workflow run triage-fields.yaml` and
  `GH_REPO={{repo}} scripts/triage-fields.sh --dry-run`.
- **The Project board** (with a board): the Status options with their meanings
  (`github-setup.md`, section 8), that the board's workflows move an item to
  In Review when a PR links to it and to Done when it closes, and the four
  views.

Leave out the sections and sentences for what the answers turned off.

## SECURITY.md

```markdown
# Security Policy

## Supported Versions

Only the latest release receives security fixes.

## Reporting a Vulnerability

**Do not open a GitHub issue for security vulnerabilities.** <The chosen
channel: "Report them privately through GitHub's [private vulnerability
reporting]({{url}}/security/advisories/new) (the repository's **Security** tab,
**Report a vulnerability**).", "Email <address>.", or "Contact the maintainer
privately via their [GitHub profile](https://github.com/{{handle}})."> 

Include as much detail as possible:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof-of-concept
- Any suggested mitigations

You can expect an acknowledgement within 72 hours and a resolution timeline
within 14 days for confirmed issues.

## Patching

A critical advisory in a dependency is patched within 72 hours of reaching the
maintainer. Dependabot alerts report each one, and its security update pull
requests carry the fix where one is published.

## Secrets

Secret scanning and push protection are on for the repository, and the
pre-commit hook and CI scan every change with Trivy (`CONTRIBUTING.md`, _Secret
scan before each commit_). A secret that reaches a commit is treated as leaked:
revoke and replace it first, then remove it from the history.

## Threat Model

TODO(setup): What the project runs, who can reach it, what it trusts, and what
it stores. Then what is in scope, and what is out of scope by design.

### In scope

- TODO(setup)

### Out of scope (by design)

- TODO(setup)
```

Without secret scanning (`github-setup.md`, section 1), the Secrets section
says only the hook and CI scan.

## CODE_OF_CONDUCT.md

The Contributor Covenant 2.1, abridged: **Our Pledge** (a harassment-free
experience for everyone, regardless of age, body size, disability, ethnicity,
gender identity and expression, level of experience, nationality, personal
appearance, race, religion, or sexual identity and orientation); **Our
Standards** (welcoming and inclusive language, respect for differing
viewpoints, accepting constructive feedback, and focusing on the community;
against harassment, insults and personal or political attacks, public or
private harassment, publishing others' private information, and other conduct
inappropriate in a professional setting); **Enforcement** (report to the
security channel's contact; complaints are reviewed promptly and fairly, and
the reporter's confidentiality is kept); and **Attribution** to
https://www.contributor-covenant.org, version 2.1.

## LICENSE and AUTHORS

Proprietary `LICENSE`:

```
Copyright (c) {{year}} {{holder}}. All rights reserved.

This software and its source code, assets, and documentation (the "Software")
are proprietary. No license, express or implied, is granted to use, copy,
modify, merge, publish, distribute, sublicense, or sell the Software, in whole
or in part, without prior written permission from {{holder}}.
```

Open source: `gh api licenses/<key> --jq .body`, with its year and holder
placeholders filled in.

`AUTHORS`: a comment block ("Below is a list of people and organizations that
have contributed to {{name}}", the `Name/Organization <optional: email address>`
format, an invitation to add yourself in a PR, and thanks), then the company
(if any) and the human's name. A private repository adds their email from
`git config user.email`; a public one doesn't.

## .github

**`CODEOWNERS`:** a comment that these owners are requested for review on
every pull request unless a later match takes precedence, then
`* @{{handle}}`.

**`labels.json`**, one object per label, with each area's description:

```json
[
  { "name": "ci", "color": "a3b6ff", "description": "CI workflows, checks and repo automation (.github/)" },
  { "name": "config", "color": "c2cfff", "description": "Build, editor and tool configuration" },
  { "name": "documentation", "color": "dde4ff", "description": "Docs, guides and agent instructions" },
  { "name": "infra", "color": "55699a", "description": "Infrastructure, deployment and platform services" },
  { "name": "dependencies", "color": "c4b9a3", "description": "Updates a dependency; applied by Renovate, Dependabot and the labeler" },
  { "name": "triage", "color": "ffe45c", "description": "New; not yet reviewed or prioritized" },
  { "name": "question", "color": "fff1a8", "description": "An open question; more information is needed" },
  { "name": "needs decision", "color": "d69a1e", "description": "Waiting on a maintainer decision before work starts" },
  { "name": "tech-debt", "color": "8a1c4a", "description": "Structural debt with a concrete cost; not a user-facing bug" },
  { "name": "autorelease: pending", "color": "ede6d7", "description": "Release PR not yet released; managed by release-please" },
  { "name": "autorelease: tagged", "color": "b1a999", "description": "Release PR whose release is tagged; managed by release-please" }
]
```

Add the project's own areas, in blues. Drop the two `autorelease` labels
without releases. A personal account adds its type labels (`github-setup.md`,
section 5).

**Issue forms** in `ISSUE_TEMPLATE/`, each with the header. An organization sets
`type: Bug`, `type: Feature`, or `type: Task`; a personal account sets
`labels: [bug]`, `[enhancement]`, or `[task]` instead.

- `bug_report.yaml`: "Bug Report", "Something isn't working correctly":
  - Description (textarea, required): what happened, and what you expected.
  - Steps to Reproduce (textarea, required, with a numbered placeholder).
  - Version (input, required): the release, commit, or deployment, with the
    placeholder `v1.2.0, or a1b2c3d`.
  - Environment (input): operating system, browser, runtime, or device.
  - Logs or Error Output (textarea, `render: text`).
- `feature_request.yaml`: "Feature Request", "Suggest an improvement or a new
  capability":
  - Problem or Motivation (required).
  - Proposed Solution (required).
  - Alternatives Considered.
- `task.yaml`: "Task", "A specific piece of work that is neither a bug nor a
  feature":
  - Goal (required): what needs doing, and why now.
  - Acceptance Criteria (required): one checkable item per line, numbered.
  - Notes: links, constraints, or the parent issue.
- `config.yml` (GitHub reads only that name for the chooser, never
  `config.yaml`): `blank_issues_enabled: false`, and one contact link, "Security
  Vulnerability", to `{{url}}/blob/{{branch}}/SECURITY.md` ("Please report
  security issues privately, as SECURITY.md describes").

**`PULL_REQUEST_TEMPLATE.md`:**

```markdown
<!-- Be sure your PR title follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) guidelines.

Your PR title should use [imperative mood](https://git.kernel.org/pub/scm/git/git.git/tree/Documentation/SubmittingPatches?h=v2.36.1#n181) as if you are giving orders to the codebase to change its behavior. The title should be present tense. Avoid the use of capitalization, unless you are referencing a proper noun.

Here are some examples of good PR titles:
- feat: change the whitelist skipper function in the middleware to use regex
- fix: insert missing await on audio device list
- chore: move the runners to ubuntu-24.04

For each section below, if there's content to add, replace the description `None`. -->

## Description

<!-- Replace this with a description of what this PR is changing or adding, and why. If you've changed UI, include screenshots/video of the new UI.* -->

None

## Issues

<!-- List all of the issues this PR fixes. Use a bulleted list like:
- Closes #101
- Closes #103
-->

None

## Type of Change

<!-- Put an `x` in all the boxes that apply, do not delete the others: -->

- [ ] ❌ `!` -- Breaking change (fix or feature that would cause existing
      functionality to change)
- [ ] ✨ `feat` -- New feature (non-breaking change which adds functionality)
- [ ] 🛠️ `fix` -- Bug fix (non-breaking change which fixes an issue)
- [ ] 📝 `docs` -- Additional or updated documentation
- [ ] 🎨 `style` -- Code style changes (formatting, missing semi colons, etc)
- [ ] 🧹 `refactor` -- Code refactor
- [ ] ⚡ `perf` -- Performance improvement
- [ ] 🧪 `test` -- Tests (adding or updating tests)
- [ ] 🏗️ `build` -- Build system or external dependencies changes
- [ ] ✅ `ci` -- Build configuration change
- [ ] 🗑️ `chore` -- Grunt tasks
- [ ] ⏪ `revert` -- Revert previous changes
```

## Agents and editor

**`.mcp.json`** (a user interface only):

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@<latest version, pinned>"]
    }
  }
}
```

**`.editorconfig`:** `root = true`; for `[*]`, utf-8, `lf`, spaces, an indent
of 2, a final newline, and trimmed trailing whitespace; `[*.md]` keeps
trailing whitespace; `[Makefile]` uses tabs.

**`.gitattributes`:** `* text=auto`; `text` for css, go, html, java, js, json,
md, py, sh, ts, txt, xml, yaml, and yml; `text eol=crlf` for bat, cmd, ps1,
and sln; `binary` for gif, gpg, ico, jar, jpg, pdf, png, webp, and zip; and,
with releases, `CHANGELOG.md linguist-generated`, since release-please writes
it. Add the stack's own extensions.

**`.gitignore`:** with a comment per group: `.DS_Store`, `Thumbs.db`, `*.pem`,
`*.key`, `*.log`; editors (`.idea/`, `*.swp`, `.vscode/*` except
`extensions.json` and `settings.json`); env files (`.env*` except
`.env.example`, which holds placeholders only); agents' local settings
(`.claude/settings.local.json`). Then the stack's build output, dependencies,
and caches, or `TODO(setup)` without a stack.

**`.vscode/extensions.json`:** EditorConfig.EditorConfig,
github.vscode-github-actions, redhat.vscode-yaml, timonwong.shellcheck,
streetsidesoftware.code-spell-checker. **`.vscode/settings.json`:** a ruler at
80, `\n` line endings, a final newline, trimmed trailing whitespace except in
Markdown, Markdown wrapped at column 80, and `redhat.telemetry.enabled: false`.

## docs/adr

`README.md`: "Architecture decision records". Each record explains one
decision: the problem, the options weighed, what was chosen and why, and what
follows. Read the record before changing what it decided, and write a new one
to change it. Then an empty index table (Number, Title, Status), and
**Writing one**:

- **Name:** `NNNN-short-title.md`, numbered from `0001` and never reused, started
  from `0000-template.md`, with a row added to the index.
- **Sections:** status, context, the options weighed, the decision with its
  reasons, the consequences, and the ticket it came from.
- **Status:** _Proposed_ in review, _Accepted_ once the owner accepts it, and
  _Superseded by NNNN_ when replaced. A partial replacement names the part
  replaced.
- **Change:** never rewrite an accepted decision; supersede it. Typo, link, and
  ticket fixes are fine.
- **Ship it** with the pull request it describes, or before the work that
  relies on it.
- **Leave out** prices, secrets, credentials, personal details, and exploit
  detail.

`0000-template.md`: `# NNNN. Title of the decision`, the Status (Proposed),
Date, and Ticket bullets, then Context, Options (Option A and B, each with
what it costs and gives), Decision, and Consequences, each with a one-line
prompt.
