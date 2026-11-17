# CLAUDE.md

`@worldware/msg` — message localization tooling (TypeScript, Vitest, tsup).

## Source of truth

Before working on a GitHub issue, read these in order. They are authoritative;
if anything here conflicts with them, follow them and say so.

1. [project/process.md](project/process.md) — the phased development workflow.
2. [project/rules.md](project/rules.md) — Definition of done, coding standards,
   branches, commits, and PR conventions.
3. [project/info.md](project/info.md) — repo facts, structure, and commands.

The `/implement-github-issue <n>` skill walks through that workflow.

## Commands

| Purpose     | Command            |
| ----------- | ------------------ |
| Tests       | `npm test`         |
| Type-check  | `npx tsc --noEmit` |
| Build       | `npm run build`    |
| Coverage    | `npm run coverage` |
| API docs    | `npm run docs`     |

## Non-negotiables

- **Approval gates:** phases marked **[approval]** in `project/process.md` end
  your turn. Wait for explicit approval before continuing.
- **TDD:** write failing tests first; don't weaken tests to force a pass.
- **Definition of done:** tests, type-check, build, and coverage (> 90%) pass
  before asking to advance a phase.
- **Branches:** `msg-<issue number>`, cut from an up-to-date `main`.
- **Commits:** prefix intermediate commits with the phase (`scaffold:`,
  `implement:`, `optimize:`, `validate:`, `document:`, `refactor:`,
  `process:`) and reference the issue (`Refs #42`).
- **PRs:** open as a draft early; the title follows Conventional Commits
  because it becomes the squashed commit.
- **Public API:** anything exported from `src/index.ts` is public; changing it
  is a breaking change and must be called out.
- Never commit `dist/`, `coverage/`, `docs/`, or `.env` files.
