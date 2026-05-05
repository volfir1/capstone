# MCP Scaffold

Session-local MCP files live here.

## Purpose
- Use `streamable-http` for remotes.
- Keep logs concise.
- Keep tooling light enough to avoid unnecessary GPU pressure.
- Allow `MCP_HOST` and `MCP_PORT` overrides.
- Record browser console and page errors during audits.

## Files
- `config.json`: direct attachment config, relative to the project root
- `server.json`: manifest endpoint pointer for the session
- `bootstrap.ps1`: Windows bootstrapper that installs Node.js LTS if needed, then runs `npm install`
- `bridge.mjs`: local streamable HTTP bridge
- `probe.mjs`: minimal connectivity check
- `audit.mjs`: screenshot and diagnostics client
- `doctor.mjs`: preflight checks
- `sync-server.mjs`: endpoint manifest sync

## MCP Tools
- `terminal_stream`: bounded bridge log tail
- `screenshot`: desktop, URL, or local-file capture with diagnostics
- `test_run`: bounded independent test execution
- `workspace_context`: compact workspace audit summary
- `shadow_worktree`: single-shadow experimental worktree helper
