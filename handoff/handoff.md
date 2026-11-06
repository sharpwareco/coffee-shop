# Handoff: coffee-shop (Midnight Coffee)

## Conversation so far
- The session was short. After `/clear` and `/context`, the user asked in Turkish "Bu projede ne yapıyoruz?" (what are we doing in this project?).
- I answered in Turkish from `CLAUDE.md` alone. No code was read, written or changed. No commits, branches or worktrees were made.
- The user writes Turkish, so reply in Turkish unless told otherwise.

## State of the repo
- Branch `main`, repo root `/Users/arikusu/devai/coffee-shop`.
- Uncommitted changes: `.gitignore`, `eslint.config.mjs`, `package.json`, `vitest.config.mts`.
- Untracked: `.agents/`, `.claude/`, `.scratch/`, `CLAUDE.md`, `MISSION.md`, `NOTES.md`, `RESOURCES.md`, `assets/`, `docs/`, `learning-records/`, `lessons/`, `reference/`, `skills-lock.json`.
- Nobody has looked at what these changes contain. Do not assume they are related to each other or to any task.

## Where the project knowledge lives (not repeated here)
- `CLAUDE.md`: project overview, commands, architecture, testing, dependency overrides.
- `README.md`: philosophy (shallow folders, direct functions, in-memory store; no extra layers unless asked).
- `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, `docs/agents/domain.md`: issue tracker, triage labels and domain-doc conventions.
- `.scratch/<feature-slug>/`: local issues and specs.
- Git history: a `lib/pricing` refactor (`2372b47`) was merged and then reverted (`6477b76`). Read both before trying it again.
- `docs/coverage-findings.md` is referenced by the README and `vitest.config.mts` but is missing from the repo.

## Open items
- No task is in progress and the user has not asked for any work yet.
- The next session's focus is unspecified, because no arguments were passed to `/handoff`. Ask the user what they want to do.

## Suggested skills
Call the Skill tool for these when the task matches:
- `tdd` (or `mattpocock-skills:tdd`): building features or fixing bugs test-first.
- `diagnosing-bugs`: anything broken, failing or slow.
- `domain-modeling`: terminology, `GLOSSARY.md` or ADR work.
- `codebase-design`: module-interface or seam decisions (but check the README philosophy first).
- `code-review`: reviewing a branch or PR.
- `grilling`: stress-testing a plan.
- `context7-mcp`: current docs for Next.js, React, Vitest and other libraries. The user's global rules require Context7 for library questions.

## Cautions
- Don't add layers, databases or abstractions unless asked.
- Don't remove or "fix" the `tools/fast-glob-shim` override or the `postcss` override. See the README.
- Call `resetStore()` between tests that touch the store.
- This is a background job session. Call EnterWorktree before any file edit.
