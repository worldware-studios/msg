# Project Rules

Rules referenced by `project/process.md`. They cover the definition of done,
coding standards, commits, branches, and pull requests. When a rule and the
process conflict, fix the conflict rather than silently ignoring either.

## Definition of done

A change is only "done" when all of the following pass locally:

1. **Tests:** `npm test` — all tests green.
2. **Type-check:** `npx tsc --noEmit` — no type errors.
3. **Build:** `npm run build` — compiles cleanly with tsup.
4. **Coverage:** `npm run coverage` — meets the coverage target (see below).
5. **Docs:** public API changes are reflected in doc comments and, when
   relevant, in `README.md`.

Do not request approval to advance a process phase until the checks relevant to
that phase pass.

## Coding standards

- **TypeScript strict mode.** Honor `strict` and `noUncheckedIndexedAccess`.
- **Avoid `any`.** Prefer precise types, generics, or `unknown` with narrowing.
- **ES modules only** (`import`/`export`), matching the NodeNext module setting.
- **Naming:** clear, descriptive names for variables, functions, and classes.
- **File layout:** classes in `src/classes/<Name>/<Name>.ts`, utilities in
  `src/lib/`, tests in `src/tests/` named `*.test.ts`.
- **Public API:** anything exported from `src/index.ts` is public; changing it
  is a breaking change and must be called out explicitly.
- **Comments:** explain intent and trade-offs, not what the code obviously does.
- **Formatting:** follow the surrounding code style; do not reformat unrelated
  code in a change.

## Testing

- Every new feature ships with tests; every bug fix ships with a test that fails
  before the fix and passes after.
- Write tests before implementation (TDD) as described in the process.
- **Scaffold assertions:** Prefer behavioral checks (value changed; placeholders
  / syntax preserved; format still formats) over brittle guesses about how a
  third-party transform (e.g. `pseudo-localization`) maps individual letters.
  If an assertion is proven wrong against real library output, fix the test and
  explain why—do not weaken coverage to force a pass.
- **Coverage target:** cumulative line/branch coverage **> 90%**; aim higher.
  The target applies to the whole suite, not only integration/e2e tests.
- Do not weaken or delete tests to make a change pass unless the test is proven
  wrong; if so, explain why.

## Branches

- Branch off an up-to-date default branch: `git checkout main && git pull`
  before creating the work branch.
- Name the work branch `<repo>-<issue number>` (e.g. `msg-42`).
- Keep one branch per issue.

## Commits

Intermediate commits made by an agent while working an issue are **temporary
scaffolding** — they are squashed when the PR is merged, so their individual
messages do not need to satisfy Conventional Commits. Optimize them for
traceability through the phases instead.

- Prefix each intermediate commit with its process phase:
  `scaffold:`, `implement:`, `optimize:`, `validate:`, `document:`,
  `refactor:`, or `process:` (see `project/process.md`).
- Write the summary in the imperative mood, <= 72 characters.
- Use the body to explain the "why"; reference the issue (e.g. `Refs #42`).
- Commit in small, coherent units — do not batch an entire phase into one
  opaque commit. A phase may produce several commits.
- Never commit generated output (`dist/`, `coverage/`, `docs/`), secrets, or
  `.env` files. Generated API docs are produced on demand (see the docs step)
  and are git-ignored like other build output.
- Human-authored commits outside this agent workflow follow `CONTRIBUTING.md`,
  which is unchanged.

## Pull requests

- The PR is the unit that lands on the default branch: it is **squash-merged**,
  so the squashed commit inherits the PR title.
- **Title the PR using [Conventional Commits](https://www.conventionalcommits.org):**
  `type(scope): summary`, e.g. `feat(resource): add xliff import`.
  - Allowed types: `feat`, `fix`, `refactor`, `test`, `docs`, `build`, `chore`,
    `perf`, `ci`.
- Open a **draft PR early** (after the first pushed commit) so CI runs
  throughout, and mark it ready for review at the end of the process.
- Target the parent/default branch (`main` unless told otherwise).
- PR description must explain the "why" as well as the "what", link the issue,
  and include examples where useful.
- CI (tests + build) must be green before requesting review.
- Respond to review comments and CI failures promptly; push fixes as new
  commits rather than force-pushing shared history.
- Keep PRs focused and reasonably sized; split large work into multiple PRs.
- Meta-changes to `project/process.md` or `project/rules.md` belong in a
  separate PR from feature work.

## Failure handling

- If tests cannot be made to pass, or the chosen approach proves wrong
  mid-implementation, stop and surface the problem to the user with options
  rather than forcing the happy path.
- Prefer reverting a bad change over layering fixes on top of it.
