## Development Process

This is the standard process for executing development tasks captured in GitHub
issues. Follow it unless instructed otherwise. Use the information in
`project/info.md` and follow the rules in `project/rules.md`. In particular,
every phase's completion is gated by the **Definition of done** in
`project/rules.md` (tests, type-check, build, and coverage as applicable).

Commits made during this process are **intermediate**: they use the phase
prefixes below and are squashed when the PR is merged. The lasting record is the
**PR title, which must follow Conventional Commits** (see `project/rules.md`).

### Choosing a track

Scale the ceremony to the work:

- **Standard track:** follow all phases below. Use for new features, non-trivial
  changes, anything touching the public API, or anything with meaningful
  trade-offs.
- **Lightweight track:** for trivial, well-understood changes (typo fixes, small
  bug fixes, docs-only edits). Collapse the process to: phase 1 (verify issue),
  a combined implement-with-tests step (phases 3-4), phase 6 checks, and phase
  10 (PR). Skip mandatory internet research (phase 2) and separate
  optimize/refactor phases unless they prove necessary.

State which track you are using at the start and let the user override it.

### Approvals

Phases below marked **[approval]** require waiting for explicit user approval
before proceeding. Other checkpoints are for sharing progress; use judgment and
keep momentum on the lightweight track.

When the user has already approved **entering** a phase, present findings and
apply clear, default improvements in the same turn when that keeps momentum
(especially phase 5). Still report what changed; defer only contested or
ambiguous choices for a separate confirmation.

### 1. Review and verify the GitHub issue.
1. If the user did not give an issue number, ask for one. If they ask you to
   open an issue (or none exists yet for the agreed work), create it with `gh
   issue create`, share the URL, and proceed once they confirm.
2. Review the GitHub issue indicated by number by the user (or just created).
3. Summarize the issue in 250 words or less.
4. Ask for feedback to confirm your understanding is correct. **[approval]**
5. Ensure the default branch is current: `git checkout main && git pull`.
6. Create a new branch off the default branch named `<repo>-<issue number>`
   (see branch rules in `project/rules.md`).

### 2. Research, analyze, and select the best approach.
1. Research different approaches to the issue (internet + codebase). On the
   lightweight track this may be skipped if the approach is obvious.
2. Analyze and rank approaches by simplicity and time/space complexity.
3. Evaluate each approach against the rules in `project/rules.md`.
4. Select the highest-ranked approach that adheres to the rules.
5. Surface the selected approach to the user and explain why it is best.
6. Incorporate user feedback into the approach. **[approval]**

### 3. Scaffold code and write failing unit tests.
1. If needed, create new class file(s) under `src/classes/<Name>/`.
2. If needed, create new utility function file(s) under `src/lib/`.
3. Stub out class properties and methods, defining input and output types.
4. Stub out utility functions, defining input and output types.
5. Create failing unit tests in the appropriate files under `src/tests/`.
   Prefer behavioral assertions (output differs from source; placeholders and
   syntax markers remain) over brittle expectations about how third-party
   transforms spell individual characters—see Testing in `project/rules.md`.
6. Briefly explain the scaffolding and tests to the user and ask for feedback.
7. Commit the scaffolding in small, coherent commits prefixed with `scaffold:`
   (see `project/rules.md`).
8. Push the branch and open a **draft pull request** whose title follows
   Conventional Commits, so CI runs from here on. **[approval]**

### 4. Iteratively implement code until all unit tests pass.
1. Implement all class methods and functions using the selected approach until
   all unit tests pass. Do not change tests unless proven wrong (see rules).
2. Keep commits small and coherent as you go, prefixed with `implement:`; push
   regularly so CI stays green.
3. Report when all code is written and tests pass; confirm CI is green.
4. Review the code with the user and incorporate suggestions. **[approval]**

### 5. Review and optimize the codebase.
1. Review the code and identify any issues or improvements.
2. Explain potential issues and improvements to the user.
3. When the user has already approved entering this phase, apply clear/default
   optimizations in the same turn and report what changed; ask before anything
   contested or scope-expanding. Otherwise wait for feedback first.
4. Implement remaining agreed changes.
5. Make sure all unit tests still pass; adjust code and tests as needed.
6. Review the code with the user and incorporate suggestions.
7. Commit the changes prefixed with `optimize:` and push. **[approval]**

### 6. Validate with integration and e2e tests, if appropriate.
1. Write any necessary integration tests.
2. Write any necessary e2e tests.
3. Ensure cumulative test coverage is greater than 90%; aim for the highest
   feasible coverage.
4. Make sure all unit, integration, and e2e tests pass and CI is green.
5. Review the code with the user and incorporate suggestions.
6. Commit the changes prefixed with `validate:` and push. **[approval]**

### 7. Review, add, and update documentation.
1. Review code so all classes, properties, methods, and functions are
   accurately documented.
2. Update any documentation affected by the change, including `README.md` and
   `GETTING_STARTED.md`. Create these files if they do not exist.
3. Generate API documentation into the `docs/` folder via `npm run docs`
   (backed by `typedoc src/index.ts`; add the `docs` script and the `typedoc`
   dev dependency if they are missing). The generated `docs/` output is
   git-ignored — regenerate it on demand rather than committing it.
4. Review the documentation with the user and incorporate suggestions.
5. Commit the changes prefixed with `document:` and push. **[approval]**

### 8. Perform final review and refactor.
1. Perform a final review of the codebase for errors or areas for improvement.
2. If necessary, refactor to address them.
3. Confirm the Definition of done still passes (tests, type-check, build,
   coverage) and CI is green.
4. Review the refactoring with the user and incorporate suggestions.
5. Commit the changes prefixed with `refactor:` and push. **[approval]**

### 9. Review the execution process.
1. Review the process just completed and briefly summarize it for the user.
2. If problems are identified, surface them with suggestions for improvement.
3. If the user approves improvements, update `project/process.md`.
4. If rules need adjusting, verify with the user and update `project/rules.md`.
5. Commit any meta-changes prefixed with `process:` in a **separate branch and
   pull request** from the feature work, per `project/rules.md`.

### 10. Create the pull request.
1. Mark the draft pull request ready for review against the parent/default
   branch. Follow the pull request rules in `project/rules.md`.
2. Ensure the PR title follows Conventional Commits — it becomes the squashed
   commit message when the PR is merged.
3. Ensure CI is green, then request review.
4. Notify the user with a link to the pull request on GitHub.
5. Respond to CI failures and reviewer comments by pushing follow-up commits
   until the PR is approved and merge-ready.
6. Notify the user that the process is complete and ask if they need anything
   else related to this issue.

### Handling failures

If tests cannot be made to pass, the approach proves wrong mid-implementation,
or any gate cannot be met, stop and surface the problem to the user with options
rather than forcing the happy path (see `project/rules.md`).
