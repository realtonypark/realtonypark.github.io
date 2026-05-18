---
layout: post
title: Learning innovation and leadership from Moneyball
tags:
  - essay
published: false
excerpt: Karpathy showed that an LLM can maintain a wiki that compounds over time instead of rediscovering knowledge from scratch on every query. I took that idea, wired it into my Obsidian vault alongside my blog, and now Claude Code runs the whole thing. Here's the system.
---
![Obsidian Graph View](/assets/posts/obsidian-brain-graph.png)

Andrej Karpathy published a workflow earlier this year that reframed how I think about LLMs and documents. The core observation: most people use LLMs in a retrieval pattern. You upload files, the model grabs relevant chunks at query time, and generates an answer. RAG. NotebookLM. ChatGPT file uploads. They all work this way, and they all share the same weakness — the model rediscovers knowledge from scratch on every question. Nothing compounds. Ask a subtle question that requires synthesizing five documents, and the LLM has to find and stitch together the relevant fragments every single time.

Karpathy's alternative: have the LLM incrementally build and maintain a persistent wiki. When a new source arrives, the model doesn't just index it. It reads the source, extracts key information, and integrates it into an existing knowledge structure — updating entity pages, revising summaries, noting contradictions, strengthening or challenging the evolving synthesis. Knowledge is compiled once and kept current, not re-derived on every query.

I took that idea and built it into my actual daily workflow. My Obsidian vault is both my blog repository (Jekyll, GitHub Pages) and my personal notebook. Claude Code, Anthropic's CLI agent, sits on top of it and maintains a wiki layer between my raw notes and published output. Here's the full system and why I think it's better than anything else I've tried for personal knowledge management.

## The architecture

Three layers:

**Raw sources** — the stuff I accumulate. Private memos in `_memo/`, web clippings, startup specs, investment research, and my published blog posts in `_posts/`. These are immutable. Claude reads them but never touches them.

**The wiki** — a directory called `_brain/` containing LLM-generated markdown files. Source summaries, entity pages (people, companies, products), concept pages (mental models, frameworks, technical patterns), and synthesis pages (multi-source analyses). Claude owns this layer completely. It creates pages, updates them when I ingest new sources, maintains cross-references with `[[wikilinks]]`, and keeps everything internally consistent.

**The schema** — a `CLAUDE.md` file and a `SCHEMA.md` that tell Claude how the wiki is structured, what the conventions are, and what workflows to follow. This is the configuration layer. It's what makes Claude a disciplined wiki maintainer instead of a generic chatbot.

The blog (`_posts/`) sits on top as the public output layer. It's where the best thinking graduates to. Everything below it is machinery.

## How it works in practice

Three operations.

**Ingest.** I drop a new source — an article, a memo, a clipping — and tell Claude to process it. Claude reads the document, creates a source summary page, identifies entities and concepts, creates or updates their wiki pages, adds everything to the master index, and appends a log entry. A single source typically touches 5-15 wiki pages across the system. When I ingested my startup's product memo, it created pages for the company, the co-founders, the technical architecture concepts (local-first, source-grounding, voice profiles), the sales motion, the competitive landscape — all cross-linked.

Here's what a source page looks like after ingest:

```markdown
---
type: source
title: "Oddity 1 Product Memo"
created: 2026-05-09
updated: 2026-05-09
tags: [startup, edtech, product]
sources: ["_memo/Product Memo.md"]
---

## Summary
Internal product design doc for Oddity 1's AI counselor.
The core bet: the bottleneck in college rec letters isn't
drafting — it's that counselors don't know their students
deeply enough to write anything non-generic.

## Key Points
- Talk-Read-Write pipeline captures student voice...
- Source-grounding with verbatim gate prevents hallucination...

## Entities Mentioned
- [[oddity1]] — the product itself
- [[gemini]] — inference backend (2.5 Pro/Flash)
- [[tauri]] — desktop framework choice

## Concepts Mentioned
- [[source-grounding]] — every claim traces to verbatim quote
- [[local-first]] — student data never leaves the device
- [[blandness-test]] — what admissions officers use to detect AI
```

Every entity and concept in that list has its own page. `[[oddity1]]` has an overview, a "Mentioned In" section linking back to every source that references it, and cross-links to related entities. Same for `[[source-grounding]]` — it has a definition, key points, and backlinks. The wiki builds a map that gets denser with every ingest.

**Query.** I ask questions and Claude answers from the wiki's compiled knowledge, not from re-reading raw files. The difference is real. When I ask "what's the connection between stablecoins and autonomous AI agents?", Claude doesn't grep through my 15 memos and 18 blog posts looking for matches. It checks the index, reads `[[autonomous-agent-payments]]`, `[[x402]]`, `[[circle]]`, `[[structural-neutrality]]`, finds the connections already established across multiple ingested sources, and synthesizes. The answer draws on my Circle deep dive, my investment strategy memo, and my blog post about Circle as the Visa of the AI era — but it doesn't need to re-process any of them because the relevant knowledge is already compiled into atomic pages.

If the answer is substantial enough to be reusable, I file it as a synthesis page. Good questions become permanent wiki content. The explorations compound.

**Lint.** Periodically I ask Claude to health-check the wiki. It scans for broken wikilinks, orphan pages nobody references, stale content, missing index entries, concepts that are mentioned but don't have their own page yet. It's like running a linter on your knowledge graph. Tells me where the gaps are, what new sources could fill them, what contradictions have emerged between older and newer information.

## Why this is better than RAG

RAG has no memory. Every query starts cold. The embedding search might miss relevant documents if the phrasing is slightly different. There's no cross-referencing, no contradiction detection, no accumulated synthesis.

The wiki approach means that by the time I ask a question, most of the hard intellectual work is already done. Entities are already identified and linked. Concepts are already defined and cross-referenced. Relationships are already mapped. The LLM at query time is reading a pre-built knowledge graph, not doing ad-hoc retrieval over a pile of unstructured text.

Concrete example: my vault has 15 private memos about my startup (product specs, security architecture, YC application, sales playbooks, outreach scripts). RAG would retrieve maybe 3-4 of those per query based on embedding similarity. The wiki has already synthesized all 15 into a dense cluster of entity and concept pages — `[[oddity1]]` alone has "Mentioned In" links to 9 different source pages. When I query something about the startup, I get answers informed by the full picture, not a lossy retrieval sample.

## The Obsidian angle

The wiki lives as markdown files in an Obsidian vault. That's deliberate. Obsidian's graph view shows me the shape of my knowledge — which pages are hubs, which are orphans, which clusters are forming. I can browse any wiki page in the editor. `[[wikilinks]]` are clickable. The backlinks panel shows everything that references the current page.

Every wiki page has YAML frontmatter (type, tags, creation date, source references), which means Obsidian's Dataview plugin can generate dynamic tables — show me all entities tagged `fintech`, all concepts tagged `investing`, all sources ingested in the last week.

The vault is also my blog repo. Jekyll builds from `_posts/`. The blog is the public output layer; `_brain/` is gitignored. So the system is private — all my notes, memos, wiki content stay local — but the published posts that graduate from it are version-controlled and deployed.

## Why Claude Code specifically

Claude Code runs in the terminal, has full filesystem access, and maintains a project-level `CLAUDE.md` that persists across sessions. That last part is the key differentiator. The `CLAUDE.md` + `SCHEMA.md` files mean every new session inherits the full context of how the wiki works, what the conventions are, and how to operate on it. I don't re-explain the system every time.

It also means I can define workflows declaratively. The schema says: when ingesting, do these steps. When querying, check the index first. When linting, scan for these specific issues. Claude follows the schema because it reads it at session start. The wiki maintains itself.

File access matters too. Claude Code can read my gitignored `_memo/` folder, read PDFs (with poppler), and write directly to `_brain/`. The operation is: I type "ingest `_memo/Clippings/new-article.md`" and the wiki updates. No upload step, no context window management, no copy-pasting.

## Extending Karpathy's idea for blogging

Karpathy's framing is about research knowledge management. I extended it for something slightly different: the wiki is also the engine behind my blog.

When I write a new post, I'm drawing on compiled wiki content. The Circle post started as a query against my wiki — "what's the stablecoin landscape look like and where does Circle fit?" — which pulled from my Circle deep dive clipping, my investment strategy memo, and my tokenization post. The synthesis was already half-done. I was connecting dots that had already been identified and cross-linked, not starting from a blank page.

When I publish a post, I ingest it back into the wiki. The blog post becomes a source. Its arguments feed into entity and concept pages. The published writing strengthens the private knowledge structure, which in turn makes the next post easier to write. The loop runs in both directions.

## Current state

195 wiki pages: 36 source pages, 59 entity pages, 100 concept pages. Covering startups, investing, film analysis, programming, sports analytics, productivity frameworks, and philosophy. All cross-linked. All indexed.

The system took about an hour to set up and an afternoon to run the initial mass ingest. Now it's maintenance mode — I ingest new sources as they come in, query when I need to think through something, lint occasionally. The compounding has already started. Each new source I ingest connects to more existing pages than the last one did.

I think this is what personal knowledge management was always supposed to be. A living map of everything you know that gets denser and more useful over time, maintained by something that never forgets to update the cross-references. Every note-taking app I've tried before eventually became a graveyard. This one doesn't, because I'm not the one responsible for maintaining the connections.
