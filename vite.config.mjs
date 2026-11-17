import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Type-level tests (*.test-d.ts) run with `npm test`. tsconfig.json
    // already includes them, so `npx tsc --noEmit` checks them too.
    typecheck: {
      enabled: true,
      include: ['src/tests/**/*.test-d.ts']
    },
    coverage: {
      exclude: [
        '**/*.json'
      ]
    }
  },
})
