# Project Info

This file captures the facts an agent needs before executing the development
process in `project/process.md`. Keep it accurate — the process depends on it.

## Overview

- **Name:** `@worldware/msg`
- **Description:** Message localization tooling.
- **Repository:** `worldware-studios/msg` (`git@github.com:worldware-studios/msg.git`)
- **Default branch:** `main`
- **Issue tracker:** https://github.com/worldware-studios/msg/issues
- **License:** MIT

## Prerequisites

Check these before starting the process; every GitHub step depends on them.

- **Node.js:** the version in `.nvmrc` (`nvm use`).
- **GitHub CLI:** `gh` installed and logged in (`gh auth login`) as an account
  that can create issues and push to the repository. Verify with
  `gh auth status`.
- **Git credentials:** if `origin` uses HTTPS, run `gh auth setup-git` once so
  `git push` authenticates through `gh`.

## Tech stack

- **Language:** TypeScript (strict mode, `noUncheckedIndexedAccess`, target ES2020, module NodeNext).
- **Runtime:** Node.js + npm.
- **Test runner:** [Vitest](https://vitest.dev) with `@vitest/coverage-v8`.
- **Bundler:** [tsup](https://tsup.egoist.dev) (config in `tsup.config.ts`).
- **Key dependencies:** `messageformat`, `pseudo-localization`.

## Repository structure

```
src/
  index.ts                 # Public entry point (defines the API surface)
  classes/
    index.ts               # Barrel export for classes
    MsgProject/            # MsgProject class
    MsgResource/           # MsgResource class
    MsgMessage/            # MsgMessage class
    MsgInterface/          # MsgInterface class
  lib/                     # Utility/helper functions (create as needed)
  tests/                   # Vitest specs, named *.test.ts
dist/                      # Build output (generated, not committed)
coverage/                  # Coverage output (generated, not committed)
docs/                      # Generated API docs (created by the docs step)
project/                   # Process, rules, and info for the dev workflow
```

Notes:
- Classes live in `src/classes/<Name>/<Name>.ts` and are re-exported from
  `src/classes/index.ts`, which is surfaced through `src/index.ts`.
- `src/lib/` may not exist yet; create it the first time a utility is needed.

## Commands

| Purpose            | Command               |
| ------------------ | --------------------- |
| Install deps       | `npm install`         |
| Run tests once     | `npm test`            |
| Watch tests        | `npm run test:watch`  |
| Coverage report    | `npm run coverage`    |
| Build              | `npm run build`       |
| Type-check + tests | `npx tsc --noEmit`    |
| API docs           | `npm run docs`        |

`npm run docs` runs `typedoc src/index.ts` (a dev dependency) and writes the
generated site to the git-ignored `docs/` folder; regenerate it on demand
rather than committing it.

## Continuous integration

- `.github/workflows/ci.yml` runs on every pull request and push to `main`,
  executing the Definition-of-done checks (`npx tsc --noEmit`, `npm test`,
  `npm run build`). PRs must be green here before review.
- `.github/workflows/verify-and-release.yml` runs on every version change,
  and publishes a new package to npm.