# sdlc — Agent Instructions

This is the canonical instruction set for all coding agents (Claude Code, GitHub
Copilot, and others). `CLAUDE.md` and `.github/copilot-instructions.md` defer to
this file — make instruction changes here only.

## Project Overview

This repository is the `KnobanLabs` Claude Code plugin marketplace, and holds
its one plugin, `sdlc`: a role-based agent org (technology, marketing, legal
and product trees under a CEO) that runs the software development lifecycle on
any GitHub repository. The plugin is instructions only — Markdown skills and
agents, with no hooks, MCP servers or executables — and is public under the
MIT License. Users install it with
`/plugin marketplace add KnobanLabs/sdlc` and `/plugin install sdlc@KnobanLabs`.

| Path                              | What it is                                                            |
| --------------------------------- | --------------------------------------------------------------------- |
| `.claude-plugin/marketplace.json` | The marketplace catalog: one entry, `sdlc`, sourced from `./plugins/sdlc` |
| `plugins/sdlc/`                   | The plugin. `plugins/sdlc/README.md` describes its org and layout     |
| `plugins/sdlc/skills/`            | One folder per skill; `protocol/` is the shared protocol every role loads |
| `plugins/sdlc/agents/`            | Worker definitions for every role except the CEO                      |
| `plugins/sdlc/tests/check_rules.py` | Recorded decisions, removed features, structure and token budgets   |
| `plugins/sdlc/evals/`             | Behavior cases for `claude plugin eval`, one folder per case          |

## Dev Commands

```bash
scripts/install-hooks.sh                                # turn on the pre-commit secret scan (needs Docker)
python3 -m pip install pyyaml                           # the rule checks' one dependency
python3 plugins/sdlc/tests/check_rules.py plugins/sdlc  # the plugin's rule checks
claude plugin validate ./plugins/sdlc --strict          # the plugin's manifest, skills and agents
claude plugin validate . --strict                       # the marketplace catalog
claude --plugin-dir ./plugins/sdlc                      # a session with the working copy loaded
claude plugin eval ./plugins/sdlc --tag smoke           # the cheap behavior cases, with and without the plugin
claude plugin eval ./plugins/sdlc --threshold 0.8       # every behavior case; uses your plan's usage
```

CI runs the rule checks and both validations in `Validate Branch`
(`.github/workflows/validate.yaml`), with the versions pinned there. The
behavior evals run locally only: each run is a real model call on your account.
Run them after changing a skill's description or a rule they cover, and add a
case when an agent misbehaves in a way a rule should have prevented.

## Plugin Rules

- **Never edit `version`** in `plugins/sdlc/.claude-plugin/plugin.json` by
  hand. release-please moves it, with `version.txt`, `CHANGELOG.md` and the
  `$schema` URL in `plugins/sdlc/settings.example.json`, in its release PR.
  Users receive an update only when `version` changes. Never set `version` in
  `marketplace.json`.
- **Keep the names in step.** The entry `name` in `marketplace.json` and the
  `name` in `plugin.json` are both `sdlc`. Renaming either breaks every install.
- **`check_rules.py` is the record of decisions.** When a change alters a
  recorded decision, update its entry in `RULES` in the same pull request.
  Raise a token budget only on purpose, and say why in the pull request.
- **Agent files** use `model: inherit` and no `effort`, except
  `expert-reviewer`, which is pinned (the rule checks enforce both).
- **The plugin's files carry no copyright header.** A `SKILL.md` or agent file
  must start with its frontmatter, and every line an agent loads costs tokens.
- **No `CLAUDE.md` inside `plugins/sdlc/`.** Claude Code doesn't load one from
  a plugin root; instructions for the plugin's agents go in a skill.

## Key Conventions

- **Never commit to `develop`** — it is the protected default branch. Every
  change, however small, goes on a feature branch and lands through a pull
  request. Never commit, push, or force-push to `develop` directly, even to fix
  a typo or a formatting nit.
- **Branches** are named `<handle>/<issue#>-<type>-<short-description>`, with
  `none` when there is no issue (`CONTRIBUTING.md`, _Branch Naming_).
- **Commits and pull request titles** follow
  [Conventional Commits](https://www.conventionalcommits.org/), in the
  imperative and lower case (`fix: stop the retry loop on a 404`). CI rejects a
  pull request whose title doesn't conform, and the title becomes the squashed
  commit on `develop`, its line in the changelog, and the next version's bump.
- **Pull requests** fill out every section of the template, replacing each
  `None` that applies and leaving the guidance comments in place, and list the
  issues they close (`Closes #123`).
- **CI green and every review thread resolved** before a pull request merges,
  through the merge queue. When a job fails for a reason the change can't
  explain, rerun only the failed jobs, once; a second failure is real.
- **An issue you file or triage gets all four triage fields** — set its type, a
  Priority, an Effort (both organization issue fields) and at least one area
  label. _Triaging Issues_ in `CONTRIBUTING.md` gives the values and the Effort
  rubric.
- **No new abstractions** beyond what the immediate task requires.
- **Comments** explain _why_, not _what_, and only where it is non-obvious.
- **Pin what CI runs**: Actions by commit SHA with the version in a comment,
  images by digest, and installed tools by exact version. Renovate moves all
  three.
- **No AI self-attribution** in commits, PRs, issues, or discussions — do not
  add `Co-Authored-By` model trailers, "Generated with …" footers, or similar.
- **Copyright header** — every repository config, workflow and script file that
  takes comments starts with `Copyright 2026 Knoban LLC`,
  `SPDX-License-Identifier: MIT` and the repo URL, one per line, in that file
  type's comment syntax. The plugin's files are the exception (see above).

## What to Avoid

- Do not commit secrets, tokens, keys or real credentials, even in examples or
  tests. The pre-commit hook and CI both scan for them.
- Do not add hooks, MCP servers or executables to the plugin without an issue
  that decides it first: the plugin is instructions only, and `SECURITY.md`'s
  threat model depends on that.
- Do not add error handling for scenarios that can't happen in the environment
  the code runs in.
- Do not add backwards-compatibility shims or legacy fallbacks for code you are
  changing — always prefer a clean codebase over preserving an older broken
  version.
- Do not give a workflow more permissions than its job needs: `permissions: {}`
  at the top, and each job asks for what it uses, with a comment saying why.
- Do not run CI on self-hosted runners: the repository is public, and fork pull
  requests would run on them.
