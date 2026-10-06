# Project instructions

Before changing sector dashboards, read [DASHBOARD_WORKFLOW.md](DASHBOARD_WORKFLOW.md) and follow its shared chart annotation, data classification and QA rules. Use shared assets in `assets/` for consistent behavior. Preserve visible data limitations and existing data when doing UI-only changes.

For design, color and typography changes, read [DESIGN_RULES.md](DESIGN_RULES.md). Apply the shared FinSuccess theme in `assets/fin-success-theme.css` across the hub and all sector dashboards.

Read `AI_WORKSPACE/README.md` and current status/task/update notes when available. Do not overwrite unrelated user edits.

`AI_WORKSPACE/` is not part of this repository: it is the private repository `FinSuccess-Investment-JSC/AI-dashboard-notes`, cloned into `AI_WORKSPACE/`. If the folder is missing (new machine or cloud session such as claude.ai/code), clone it there before starting. After changing notes, commit and push that repository too.

The user's standing preferences for this project live in `AI_WORKSPACE/claude-memory/` (start from `MEMORY.md`). When no Claude project memory is loaded for this folder (cloud session, new machine), read those files first and follow them like memory; when a preference changes, update the file there and push the notes repository. In a cloud session without a real browser, state that visual/browser QA was not done instead of claiming it passed.
