# Second Brain Wiki — Schema

## Identity

This is the operating manual for Tony Park's Second Brain wiki. The wiki is the intermediate layer between raw sources (articles, memos, clippings) and published output (blog posts). It compounds knowledge over time — distilling, connecting, and maintaining a persistent map of what Tony knows and thinks.

## Folder Structure

```
_brain/
├── SCHEMA.md      # This file. Operating manual.
├── index.md       # Master catalog of all wiki pages
├── log.md         # Append-only chronological operation log
├── sources/       # One page per ingested document (summaries + extractions)
├── entities/      # People, companies, products, organizations
├── concepts/      # Ideas, technologies, frameworks, mental models
└── synthesis/     # Multi-source analyses, comparisons, overviews
```

## Raw Source Locations

- `_memo/` — private memos, startup docs, specs (gitignored, path: `/Users/realtonypark/Developer/realtonypark.github.io/_memo/`)
- `_memo/Clippings/` — web clippings inside memo folder
- `_posts/` — published blog posts (git-tracked, Tony's refined public writing)

These are **immutable** during wiki operations. The LLM reads from them but never modifies them.

## Page Conventions

### Filenames
- Lowercase, hyphen-separated: `mcp-protocol.md`, `larry-fink.md`, `oddity-1.md`
- No dates in filenames (dates live in frontmatter)
- Descriptive and grep-friendly

### Required Frontmatter

```yaml
---
type: source | entity | concept | synthesis
title: "Human-readable title"
created: YYYY-MM-DD
updated: YYYY-MM-DD
aliases: []
tags: []
sources: []       # relative paths to raw source files (from repo root)
related: []       # wikilinks: [[other-page]]
---
```

### Body Structure

- Use `##` headings and below (H1 is implicit from title)
- Sections vary by type:
  - **source**: Summary, Key Points, Entities Mentioned, Concepts Mentioned
  - **entity**: Overview, Key Facts, Mentioned In, Related
  - **concept**: Definition, Key Points, Applications, Related
  - **synthesis**: Question/Thesis, Analysis, Conclusions, Sources

### Cross-References

- Internal brain links: Obsidian wikilinks `[[page-name]]` or `[[page-name|display text]]`
- Raw source links: relative markdown `[title](../_memo/file.md)` or `[title](../_memo/Clippings/file.md)`
- Tags go in frontmatter YAML, not inline

## Writing Rules

- **Always use the `/humanizer` skill when writing prose content.** Wiki pages should read like Tony's own thinking — direct, opinionated, concise. Not like LLM output.
- Keep summaries tight. 2-3 sentences for a source summary. Bullets for key points.
- Prefer Tony's voice: first-person observations, pointed assessments, no hedging.
- If something is uncertain, say so directly rather than adding qualifiers everywhere.

## Workflows

### INGEST

Trigger: User says "ingest [path]" or "ingest [url]" or drops a new source.

Steps:
1. Read the raw source document completely
2. Generate slug from title/content (lowercase-hyphenated)
3. Create `_brain/sources/{slug}.md`:
   - Frontmatter with type, title, dates, source path
   - Summary (2-3 sentences, Tony's voice)
   - Key Points (5-10 bullets)
   - Entities Mentioned (list with brief context)
   - Concepts Mentioned (list with brief context)
4. For each notable entity:
   - If `_brain/entities/{slug}.md` exists → update "Mentioned In" section
   - If not → create stub page with basic info + backlink
5. For each notable concept:
   - If `_brain/concepts/{slug}.md` exists → update with new information
   - If not → create stub page with definition + backlink
6. Update `_brain/index.md` — add rows to appropriate tables
7. Append entry to `_brain/log.md`

### QUERY

Trigger: User asks a question about their knowledge base.

Steps:
1. Read `_brain/index.md` to locate relevant pages by title/tags
2. Read the relevant wiki pages (sources, entities, concepts, synthesis)
3. Synthesize answer from wiki content with `[[wikilink]]` citations
4. If the answer is substantial/reusable, offer to file it as a synthesis page
5. If gaps exist, note what sources could fill them

### LINT

Trigger: User says "lint" or "lint brain" or "health check."

Steps:
1. Scan all `.md` files in `_brain/` (excluding SCHEMA.md)
2. Check frontmatter: every page needs type, title, created, updated
3. Check wikilinks: extract all `[[...]]`, verify targets exist
4. Check orphans: pages not referenced anywhere and not in index
5. Check index sync: every filesystem page appears in index.md
6. Check staleness: pages not updated in 30+ days with newer sources available
7. Report issues with severity (error/warning/suggestion)
8. Offer to auto-fix (add index entries, update dates, flag contradictions)
9. Append lint results to `_brain/log.md`

## Rules

1. **Never modify raw sources** (`_memo/`)
2. **Always update index.md and log.md** after any mutation
3. **Prefer updating existing pages** over creating duplicates
4. **Keep pages atomic**: one entity or concept per page
5. **Synthesis pages may reference many** sources, entities, concepts
6. **Use `/humanizer`** for all prose writing in the brain
7. **Date awareness**: use absolute dates (YYYY-MM-DD), not relative ("yesterday")
