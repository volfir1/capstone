# AGENTS.md

## Baseline
- Do not assume framework, language, layout, build, or test tooling until the project defines them.
- Do not depend on personal skill files, home-directory conventions, or user-local standards.
- Use official framework and language documentation as the primary source of truth.
- Prefer industry-standard patterns such as Clean Architecture and SOLID when they fit the project scope.

## Execution Rules
- Keep `max_parallel_subagents` at `2`.
- Detect the host hardware before tuning thread budgets.
- Reserve enough logical threads for the IDE and OS without hardcoding a machine-specific profile.
- Use at most one shadow worktree at a time.
- Use a shadow worktree for experimental features when the repository supports git worktrees.
- Prefer short burst tasks over long-lived loops.
- Prefer streamed, concise logs over raw terminal dumps.

## Hardware Rules
- Auto-detect CPU, GPU, and system RAM on the current host before deciding resource budgets.
- Keep headroom for the IDE and OS.
- Keep local code embeddings `4-bit` quantized.
- If VRAM exceeds `85%`, move embedding inference to CPU.

## MCP Rules
- Use `streamable-http` for MCP remotes.
- Prefer `mcp-schema.json` and `.mcp/config.json` before external MCP discovery.
- Keep `.mcp/server.json` synced with the active endpoint.
- Use `bootstrap.ps1` when Node.js/npm are missing so the protocol can install its own prerequisites before `npm install`.
- Use MCP-backed tools for visual navigation, isolated test execution, and deep debugging when available.
- Prefer MCP `workspace_context` and streamed logs over raw directory dumps for startup context.
- If a page is stuck, loaded but unresponsive, or visually wrong, inspect audit diagnostics first.

## Retro Rule
After each major task, append:
- What changed.
- What bottlenecks appeared.
- What to simplify or split next time.

## Retro
- What changed: upgraded the MCP SDK baseline, isolated bridge sessions per client, added startup doctor and endpoint sync scripts, exposed bounded MCP test execution, added a compact workspace context tool, and added single-shadow-worktree support.
- What bottlenecks appeared: port `7331` can already be occupied, browser-backed audit still depends on a local Chromium-family install, and shadow worktrees only apply when the target project is a git repository.
- What to simplify or split next time: keep browser control minimal unless screenshot plus test execution stops being sufficient.
- What changed: merged the protocols scaffold into the `YONDU` root, added root-level MCP bridge scripts and schema, and aligned the hardware profile to this machine.
- What bottlenecks appeared: `node` and `npm` were not available on the current shell `PATH`, so the MCP scripts could not be executed here.
- What to simplify or split next time: keep the nested bundle only as an archive once the root scaffold is established, and verify Node tooling availability before promising a runnable check.
- What changed: replaced the fixed hardware profile with runtime hardware detection so the protocol adapts on each host.
- What bottlenecks appeared: hardware detection still depends on PowerShell/WMI availability on Windows hosts.
- What to simplify or split next time: keep the manifest schema generic and let the doctor publish the live machine profile instead of hardcoding spec tables.
- What changed: added total system RAM to the runtime hardware profile so the bundle can adapt to low-memory and high-memory machines alike.
- What bottlenecks appeared: the RAM readout now depends on the same Windows detection path as CPU and GPU, so non-Windows support would need a separate fallback.
- What to simplify or split next time: keep the hardware contract small, but include the minimum fields needed for automatic budget decisions.
- What changed: added a bootstrap script that can install Node.js LTS and then run `npm install` before the bridge checks.
- What bottlenecks appeared: automatic prerequisite installation still depends on `winget` or `choco` being available on Windows.
- What to simplify or split next time: keep the bootstrap path explicit in the docs so transferred bundles do not stall at missing toolchain prompts.
- What changed: scaffolded the HabitForge app in the project root with React, Vite, Mantine, routed auth/dashboard/detail/settings pages, local-plus-Firebase-ready data services, streak analytics, charts, heatmaps, and project-specific docs/env examples.
- What bottlenecks appeared: the workspace started from an empty app surface, current Node `18.20.8` required an older Vite scaffold path, and bundle size needed manual chunking because Mantine, Recharts, and Firebase land heavy in one pass.
- What to simplify or split next time: move Firebase adapters behind dynamic imports or a separate data package, and break shared context types out earlier so lint/type setup stays quieter.
- What changed: repaired the frontend foundation by importing Mantine base styles, restyled the auth shell, app shell, dashboard hero, stat cards, heatmap container, and habit cards, and validated the refresh with lint, build, and a browser screenshot check of the auth flow.
- What bottlenecks appeared: the in-app browser runtime was unavailable because its REPL requires Node `22+`, so visual checking had to fall back to local Chrome headless capture instead of the normal browser-use path.
- What to simplify or split next time: add a lightweight seeded preview or story route for the dashboard so visual QA does not depend on interactive auth before checking post-login layouts.
- What changed: rebuilt the monthly attendance tracker workbook with a left-side header and summary panel, merged Week and Date cells per weekly group, wider Members and Remarks columns, visual weekly separators, dropdown attendance values, conditional colors, and updated summary formulas.
- What bottlenecks appeared: true merged weekly groups do not fit cleanly inside an Excel/Google Sheets filter table, so the workbook prioritizes grouped readability over table-style filtering.
- What to simplify or split next time: decide early whether the tracker should optimize for merged print-friendly sections or spreadsheet filtering/sorting, because those layouts pull in different directions.
- What changed: added a plain HTML, CSS, and JavaScript monthly attendance system with a left details panel, live attendance summary, editable weekly group cells, wider member rows, status dropdown colors, add/delete actions, print support, and browser local storage.
- What bottlenecks appeared: browser-use tooling was not exposed in this session, so verification was limited to static file checks and JavaScript syntax validation instead of an interactive screenshot pass.
- What to simplify or split next time: add a tiny smoke-test harness or approved browser launch path for static HTML apps so visual checks can happen immediately after edits.
- What changed: fixed the attendance status dropdown rendering by cloning the select element from the template content instead of querying inside the template as if it were normal document DOM.
- What bottlenecks appeared: the original static syntax check could not catch this runtime DOM lookup issue.
- What to simplify or split next time: prefer direct element creation or template-content queries for small reusable controls.
- What changed: added an "Add Date to Selected Week" flow and changed the attendance table renderer to group rows by Week first, then by Date inside each week, so a week like Week 2 can contain multiple attendance dates.
- What bottlenecks appeared: adding dates inside existing weeks required changing the table grouping model rather than just adding another row button.
- What to simplify or split next time: keep the data model week-first from the beginning whenever a schedule can have multiple dates per week.
- What changed: redesigned the attendance app with the requested `#FAF8F8`, `#17EAD9`, `#6078EA`, and `#4B4848` palette, adding Flat 2.0 structure, soft accent gradients, subtle neumorphic shadows, cleaner table states, and more corporate spacing/typography.
- What bottlenecks appeared: strict palette adherence meant replacing semantic red/yellow status colors with palette-based status treatments.
- What to simplify or split next time: define semantic status styling rules alongside the core palette before visual implementation when the app needs warning/error/status distinctions.
- What changed: removed gradients, radial glow effects, and inset neumorphic treatment from the attendance app, leaving a cleaner flat-style interface with solid palette fills, subtle borders, and restrained shadows.
- What bottlenecks appeared: keeping status states distinct while using only the strict palette required lighter alpha treatments instead of conventional red/yellow/green signals.
- What to simplify or split next time: decide whether status colors may extend beyond the brand palette before enforcing a fully flat brand system.
- What changed: moved Add Day controls into generated week section headers, added visual separators before each week, and simplified the main table so Week is represented as a section header instead of a repeated table column.
- What bottlenecks appeared: printing rules had to be adjusted because a section header row uses one spanning cell that would otherwise be hidden by the generic action-column print selector.
- What to simplify or split next time: model week sections as first-class UI components earlier when controls belong inside each grouped section.
- What changed: changed visible month/date fields from numeric browser date formats to readable month-name text such as `April 1, 2026`, while keeping internal saved dates in ISO format for calculations and grouping.
- What bottlenecks appeared: JavaScript date conversion needed local-date-safe formatting to avoid timezone shifts on Asia/Manila machines.
- What to simplify or split next time: keep separate display-date and storage-date helpers from the first version whenever users need friendly date wording.
- What changed: moved Add Member from the sidebar into the last row of each date group, so adding a member appends to that same date and the Add Member button moves to the newly added last row.
- What bottlenecks appeared: row actions needed to become date-group aware instead of record-only so the add behavior could target the correct week/date group.
- What to simplify or split next time: model grouped row actions separately from per-record delete actions when controls depend on list position.
- What changed: added a day subheader before each date group with editable "where event happened" and "time" fields, and changed row actions so Delete appears above a compact plus-only Add Member button on the last member row.
- What bottlenecks appeared: day-level metadata had to be synced across every record in the same date group so newly added members inherit the current event/place and time.
- What to simplify or split next time: store weeks, days, and members as nested data instead of repeating week/day metadata on every member record once the interface becomes section-based.
- What changed: removed the repeated date column from member rows now that each day has its own subheader, leaving member rows with only Members, Attendance, Remarks, and Action columns.
- What bottlenecks appeared: old merged-date helper code and CSS needed cleanup after the table moved from five columns to four.
- What to simplify or split next time: once day headers exist, avoid rendering duplicate day-level information inside every member row.
- What changed: replaced member delete text with an icon button, changed day date and add-day controls to real date pickers, changed day time to a real time picker, and added confirmed delete controls for weeks and days.
- What bottlenecks appeared: older saved time values may be in AM/PM text format, so the UI now normalizes them for time-picker display.
- What to simplify or split next time: migrate persisted localStorage data explicitly when changing input types or record shape.
