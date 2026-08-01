<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Plugabyte agent rules

## AI progress log (required)

After every significant work session (design, implementation, debugging, content, or decisions), create or update a markdown file in `ai-progress/`.

Name files so they sort chronologically, e.g. `YYYY-MM-DD-short-slug.md`.

Each note must include:

- **Goal** — what we set out to do
- **Done** — what changed (files, behaviour, docs)
- **Why** — rationale and constraints
- **Decisions** — choices locked or overridden
- **Next** — concrete follow-ups

Read recent `ai-progress/` notes before starting non-trivial work so you do not re-derive context. Do not skip this log.

## Product constraints (Phase 1)

- Ghost-first landing; ghost always visible and reactive
- Agency “we” voice (not solo founder branding)
- No Zoho / third-party CRM — leads in Supabase for an on-site admin later
- Canonical Phase 1 design: `docs/superpowers/specs/2026-08-01-phase1-agency-rebuild-design.md`
