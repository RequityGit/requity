## Debug Failing Tests

You are triaging CI test failures. Your goal: get all tests passing with minimal, correct changes.

### INPUT

The following tests are failing in CI. Raw failure output is below:

```
<PASTE RAW CI LOG OR ATTACH ARTIFACT>
```

### STEP 1 — Categorize each failure

For every failing test, assign exactly one category:

| Category | Meaning | Action |
|----------|---------|--------|
| **(a) Test is wrong** | Test asserts outdated behavior (old route, renamed component, removed feature) | Fix the test to match current app behavior |
| **(b) App code is wrong** | Test expectation is correct but app code has a bug | Fix the app code |
| **(c) Test infra / config** | Missing mock, bad import, env issue, missing test util | Fix the test setup |
| **(d) Missing implementation** | Test expects a page/component that doesn't exist yet | Build it (follow DESIGN_SYSTEM.md and existing patterns) |
| **(e) Flaky / timing** | Passes sometimes, fails on CI due to race conditions or timeouts | Add retry/waitFor, increase timeout, or mark `test.fixme()` with a TODO explaining why |

### STEP 2 — Fix each failure

Apply the fix matching its category. Rules:

- **Read the relevant source file** before changing anything.
- **Do NOT change assertions on passing tests.**
- If a fix touches shared test helpers, verify all consumers still pass.
- For category (d), follow existing patterns — check neighboring pages/components for structure.
- For category (e), prefer making the test deterministic. Only use `test.fixme()` as a last resort with a TODO comment.
- For category (b), if ambiguous whether the test or app is wrong, check git blame / recent PRs to determine intent.

### STEP 3 — Verify

- Run the full test suite. **All tests must pass**, including the ones that were already passing before your changes.
- If a fix causes a new failure, fix that too before proceeding.

### STEP 4 — Commit & Push

- Commit with message: `fix(tests): resolve N failing CI tests`
- Include a summary in the commit body listing each test and its category (a-e).
- Push to the designated branch.

### CONSTRAINTS

- Do not skip or delete failing tests unless the tested feature was intentionally removed.
- Do not introduce `as any` or disable lint rules.
- Do not add `console.log` — use `console.error` with context for real errors only.
- Follow the project's CLAUDE.md and DESIGN_SYSTEM.md for any new code.
