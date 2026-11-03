# Approvals

## 1. Ownership

A repository is the human's own if it matches any entry, on the same host
(`github.com` entries never match an Enterprise Server host, or the reverse):

- its current owner is the human's login (`gh api user -q .login`)
- its current owner is a user or organization listed under `owned.users` or
  `owned.organizations` in `~/.sdlc/settings.json`
- it is listed under `owned.repositories` there

Look the owner up with `gh repo view <owner/repo> --json owner -q .owner.login`;
it follows renames and transfers, so a moved repo is judged by its new owner.
**Listed repositories:** check
`gh repo view <owner/repo> --json nameWithOwner -q .nameWithOwner`; if it no
longer matches the entry (renamed or transferred), treat the repo as external
and tell the human. Enterprises can't be listed. Everything else is
**external**, including orgs the human merely belongs to and unlisted repos the
human can push to. A PR from the human's fork to
an upstream repo writes to the upstream: external. Record the result and the
matching rule in the repo profile; re-check if the remote changes. **Fail safe:**
an owner or repository that isn't listed or can't be looked up, or a
settings file that doesn't parse, means external; say why.

## 2. Dangerous, destructive, and irreversible

Anything that discards work, rewrites shared history, deletes what can't be
trivially restored, changes access or security, or publishes externally. Always
needs approval, in every repo, except sections 3 and 4. Examples:

- **git:** `push --force`/`--force-with-lease`, `push --delete`, rewriting pushed
  history (rebase, amend, `filter-repo`), `reset --hard`, `clean -fd`,
  `checkout -- .`, `restore`, `stash drop`/`clear`, `branch -D`,
  `gc --prune=now`, `reflog expire`, editing git config or hooks
- **gh:** deleting or archiving anything (including `gh api -X DELETE`),
  visibility changes, transfers, `--admin` merges, disabling workflows
- **publishing:** releases, tags, and workflows that publish, deploy, or announce

Settings, protections, rulesets, secrets, variables, collaborators, and deploy
keys are never changed unless the human asks for that specific change.

## 3. Scratch exception

Destructive **local** operations need no approval when all hold: you created the
worktree and branch in this job and the ledger records them under you; only your
work is in it; your task is still in progress (not delivered); and
`git rev-parse --show-toplevel` matches the ledger path. Covered: `reset --hard`,
`clean -fdx`, `checkout -- .`, `restore`, deleting branches you created.

Never covered, because they're shared across worktrees: the stash, branches you
didn't create, `gc`, `reflog expire`, git config, and hooks. Remote operations
are never covered, except section 4.

## 4. Force-pushing your own branch

Allowed without approval in a human-owned repo only if you created the branch in
this job, nobody else committed to it, and no pull request is open against it.

## 5. Merges

- Follow branch protection and rulesets; any admin bypass needs approval.
- Otherwise a merge may precede acceptance once required checks pass (with no
  CI: the profile's full test, lint, type, and build commands) and
  `sdlc:expert-review` converged.
- With a merge queue, queue the PR (`gh pr merge <number>`) as soon as it may
  merge, and never merge the default branch into its branch to catch up: the
  queue tests it on the latest one. Bring it in only for a conflict GitHub
  reports or to reproduce a queue failure, just before marking the PR ready or
  queueing it, not each time the default branch moves.
- A technology role merges: the CTO, a CTO workstream lead within its
  workstream, a technology role conducting itself, or the single technology
  worker of a one-task job whose brief authorizes it to merge its own PR. Other
  conductors staff the CTO or Release Engineer for it.
- Rework on merged work is a follow-up PR. In external repos, merging needs
  approval.

## 6. Asking

A worker stops the action and escalates; the conductor records a critical inbox
entry with the approval request template, which the human answers at the next
inbox check. Approval is per action; bundled requests list each action. Continue
other work while waiting.

For a new dependency or tool, give its name and version, its license and
whether IP Counsel found it compatible, what it's for, the alternatives weighed
(including building it), and why it wins.
