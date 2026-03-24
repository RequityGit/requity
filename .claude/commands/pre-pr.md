Pre-PR readiness check. Run these in order:

1. `pnpm typecheck` — must pass clean
2. `pnpm lint` — must pass clean
3. `pnpm build` — full production build must succeed
4. Check `git status` for any uncommitted files
5. Check `git log --oneline -5` for recent commit messages

Report a pass/fail summary for each step. If any step fails, stop and report the errors before continuing.