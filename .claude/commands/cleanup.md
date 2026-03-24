Quick cleanup scan:

1. Search for `console.log` statements in `apps/requity-os/` (excluding node_modules, .next)
2. Search for unused imports flagged by lint
3. Check for any `.env` or credential files that might be staged
4. Run `git diff --stat` to see scope of uncommitted changes

Report findings grouped by severity.