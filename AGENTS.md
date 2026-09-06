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
- No Zoho / third-party CRM — leads in Convex for an on-site admin later
- The scoping chat is model-driven (Z.AI / GLM), but effort is always computed by
  `computeEffort`, never by the model. It falls back to the scripted questions
  whenever the model is unavailable, so the funnel works without an LLM.
- Canonical Phase 1 design: `docs/superpowers/specs/2026-08-01-phase1-agency-rebuild-design.md`

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
