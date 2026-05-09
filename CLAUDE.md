# Tony Park's Second Brain

This repository is Tony Park's Second Brain — a personal knowledge system that publishes selectively as a blog. The blog (`_posts/`) is the public-facing output layer; it's where the best thinking graduates to. Everything else is the machinery of thought.

## Architecture

```
Raw Sources → Wiki → Published Blog
```

- **Raw sources** (`_memo/`, `Clippings/`): Immutable inputs. Articles, memos, startup docs, web clippings, personal notes. Never modify these.
- **Wiki** (`_brain/`): LLM-maintained knowledge layer. Summaries, entity pages, concept pages, synthesis. Compounds over time. See `_brain/SCHEMA.md` for operating instructions.
- **Blog** (`_posts/`): Curated public output. Pieces that have been refined from brain content into publishable essays.

## Gitignored Folders — Full Access

Claude can and should read, write, and edit files in all gitignored folders. These are private but fully accessible:

| Path | Purpose | Notes |
|------|---------|-------|
| `_memo/` | Private memos, startup docs, thoughts | Read-only (raw sources). Access at `/Users/realtonypark/Developer/realtonypark.github.io/_memo/` |
| `_memo/Clippings/` | Web clippings (private) | Inside _memo, also read-only |
| `_brain/` | Wiki layer (LLM-owned) | **Read + write.** Claude owns this entirely. |
| `_brain/SCHEMA.md` | Wiki operating manual | Git-tracked (exception) |
| `_syllabi/` | Course syllabi | Read + write |
| `_research/` | Research notes | Read + write |

Note: In worktrees, gitignored folders don't exist. Access `_memo/` at its absolute path above.

## Other Key Paths

| Path | Purpose | Access |
|------|---------|--------|
| `Clippings/` | Web clippings (repo root) | May be tracked |
| `_posts/` | Published blog posts | Git-tracked, Jekyll builds these |

## Writing

**Always use the `/humanizer` skill when writing prose content** — wiki pages, blog posts, synthesis, anything with sentences. The brain should sound like Tony thinking out loud: direct, opinionated, no filler, no hedging. Not like an LLM.

## Wiki Operations

Read `_brain/SCHEMA.md` for full details. The three core operations:

- **Ingest**: Process a raw source into wiki pages (source summary + entity/concept pages + index/log updates)
- **Query**: Answer questions by consulting the wiki's compiled knowledge
- **Lint**: Health-check the wiki for broken links, orphans, staleness, contradictions

## Site Info

- Jekyll with Minima theme
- Deployed at realtonypark.github.io
- `_config.yml` defines collections (syllabi, research) and site metadata
- `new_post.py` creates new blog posts
