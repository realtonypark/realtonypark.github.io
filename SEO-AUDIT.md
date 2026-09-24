# SEO audit — 2026-09-23

Audited production at https://realtonypark.github.io/ and an isolated branch based on `99b2800`. The published site has 22 posts. The candidate build has 30 HTML pages, of which 25 have distinct, indexable canonical URLs: the homepage, About, the topic index, and all 22 posts.

**What changed**

| Area | Verified gap | Resolution |
| --- | --- | --- |
| Discovery | Production sitemap and robots.txt returned 404. | Enable the GitHub Pages-supported `jekyll-sitemap` plugin. It generates both files and lists canonical public pages. |
| Canonicals | `/` and `/posts/` were separately canonicalized versions of the post list. | Canonicalize `/posts/` to `/`, omit the alias from the sitemap, and point internal index links to `/`. Existing post URLs stay unchanged. |
| Search snippets | Main pages had no descriptions; post descriptions ranged from vague to several paragraphs. | Add distinct descriptions through native Jekyll defaults. Keep post titles, excerpts, and source files unchanged. Give the homepage and topic index distinct, descriptive titles. |
| Structured data | Articles had no author URL and duplicated incomplete microdata alongside JSON-LD. | Use the existing SEO plugin as the single article-schema source. Add the author profile URL, social identities, language, and relevant existing article images. The About page describes the author as a Person. |
| Social previews | No configured preview images or X account metadata. | Add existing article images where available and configure the author and site handles. Text-only posts retain summary cards; no unrelated stock image is assigned. |
| Index controls | Personal holdings, an empty publications page, and an external redirect could be indexed. | Apply `noindex, follow` and omit them from the sitemap. Crawling stays allowed so engines can read `noindex`. |
| Build output | Source scripts, README, agent instructions, and inherited presentation slides were publicly served. | Exclude development/private material and unused template slides from the build. Linked research PDFs remain available but are not separate sitemap entries. |
| Favicon and errors | `/assets/icon.png` returned 404 on every page; there was no custom error page. | Add a scalable TP favicon and a noindex 404 page with links to the post and topic indexes. |
| Structure and accessibility | Main indexes and pages lacked primary headings; social icons lacked explicit names; the design toggle failed contrast. | Restore page headings, use H1/H2 for the writing index, label social links, and increase toggle contrast. |
| Loading | The homepage banner was lazy-loaded; all gallery images were eager. | Prioritize above-the-fold banners and the first post image. Apply native lazy loading to later post images through the layout, preserving explicit loading attributes. Serve responsive 640/1200-pixel banner copies and compress generated CSS. |
| Regression protection | No reproducible build or SEO check existed. | Pin the GitHub Pages Jekyll/theme/SEO/Markdown versions and add a generated-site check to CI. |

The sitemap includes only canonical public HTML pages and uses existing publication dates. This follows [Google’s sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap). No fabricated freshness dates, ratings, FAQs, or keyword lists were added. Article and author metadata follow [Google’s article guidance](https://developers.google.com/search/docs/appearance/structured-data/article) and the [SEO plugin’s supported configuration](https://jekyll.github.io/jekyll-seo-tag/advanced-usage/).

**Validation**

- Production: HTTPS returns 200; HTTP redirects to HTTPS with 301; an unknown URL returns 404. GitHub Pages reports a successful legacy build on `main`, HTTPS enforced, and no custom domain. The invalid CNAME file contained a full GitHub URL and was removed.
- Generated pages: all canonical URLs, descriptions, social URLs, JSON-LD, local resource targets, feed links, sitemap membership, page languages, and primary headings pass the automated check. No broken internal fragment targets were found in a separate crawl.
- External links: 15 of 16 distinct HTTPS destinations returned 200. LinkedIn returned its automated-request status 999; this is not evidence that the profile is missing.
- All eight existing Node tests pass. Jekyll builds successfully and `jekyll doctor` reports no problems.
- Build timestamps use UTC, matching production. The check also rejects crawler exclusions, `noindex` on published posts, and missing article schema.
- The source diff contains no changes under `_posts/` or `assets/posts/`. All 22 rendered article bodies match the baseline after removing only the added image loading attributes and outer whitespace.
- Browser checks cover the homepage at desktop and 390-pixel mobile widths, image-slider keyboard input, About-to-post navigation, and a representative post. No horizontal page overflow was observed in those mobile checks.
- Mobile Lighthouse checks on the homepage and image-heavy AI article pass SEO, accessibility, and best practices at 100. These scores cover Lighthouse’s checks, not every ranking factor.

**Measured mobile comparison**

Lighthouse 13.5.0, Chrome for Testing 153, default mobile device profile, DevTools network/CPU throttling, cold loads, local Python HTTP servers. These are single-run lab measurements on identical build dependencies. The local server does not reproduce GitHub Pages compression or CDN caching.

| Metric | Baseline | Candidate |
| --- | ---: | ---: |
| SEO | 92 | 100 |
| Accessibility | 96 | 100 |
| Best practices | 96 | 100 |
| Performance | 72 | 92 |
| Largest Contentful Paint | 16.1 s | 2.7 s |
| Total Blocking Time | 90 ms | 130 ms |
| Cumulative Layout Shift | 0 | 0 |

Responsive banner copies reduce the pair from 2.43 MB to 68 KB at 640 pixels or 213 KB at 1200 pixels (91–97% smaller). The comparable homepage lab run improves performance from 72 to 92 and LCP from 16.1 to 2.7 seconds. Earlier simulated-throttling runs varied widely; those are not used as evidence of a performance gain. The image-heavy article separately scores 100 on SEO, accessibility, and best practices, but still needs smaller images for good mobile loading speed.

**Remaining limits and follow-up**

- Article image transfer size remains a performance opportunity within the unchanged post content. The AI gallery references 7.43 MB of images, and the MLB article references 4.17 MB. Native lazy loading reduces eager requests but does not make these image files smaller. Shared banners now use smaller responsive copies; all original image files are preserved.
- Post content is intentionally unchanged. Five posts use generic `img` alt text, and Jaws uses `img|676`; the AI comparisons use empty alt attributes with labels on their surrounding controls. MediaMatch and the OpenStreetMap post include additional H1 headings in their bodies. These are editorial/accessibility improvements for a separately authorized content pass, not reasons to rewrite published prose silently.
- Search Console ownership, sitemap submission, Google-selected canonicals, actual indexed-page counts, manual actions, queries, click-through rates, and backlinks were not verified. After deployment, submit `/sitemap.xml` and inspect the homepage plus representative posts in Search Console. Only Google can confirm indexing. [Google’s starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) does not promise inclusion or rankings.
- The public PageSpeed Insights API returned HTTP 429, so no CrUX field-performance claim is made. Local Lighthouse results depend on browser, throttling, cache, and third-party font/analytics timing. External Google Fonts and Analytics remain in place.
- `noindex` is an indexing instruction, not access control. The existing holdings page still embeds its data and client-side password in public HTML; this PR does not present it as private storage.
- This branch is not deployed until the PR is merged and GitHub Pages finishes publishing. Recheck the live sitemap, robots.txt, favicon, noindex pages, and custom 404 after deployment.

**Reproduce**

```sh
bundle install
JEKYLL_ENV=production bundle exec jekyll build
python3 _test/seo.py
node --test _test/*.test.js
bundle exec jekyll doctor
```

Use Ruby 3.3 or newer. The Gemfile pins the core versions from [GitHub Pages’ dependency list](https://pages.github.com/versions/). The SEO check uses only Python’s standard library. The workflow checks pull requests and pushes to `main`; deployment remains the existing GitHub Pages branch build.

Banner derivatives can be reproduced with installed libwebp tools: `cwebp -q 82 -m 6 -resize WIDTH 0 assets/NAME.webp -o assets/NAME-WIDTH.webp`, for widths 640/1200 and names `banner`/`moneyball-ai`.

## Domain migration follow-up — 2026-09-24

The site now uses `https://tonypark.dev` as its configured origin. The successful GitHub Actions deployment confirms that the Worker has both `tonypark.dev` and `www.tonypark.dev` custom domains. Before this follow-up, direct requests to Cloudflare returned the new site with `200` on both hostnames, and the old `realtonypark.github.io` address also returned `200` with the new hostname in its canonical metadata. The configured sitemap, canonical URLs, author URL, and social preview URL use the new hostname. Cloudflare and Google public DNS resolvers return the new Cloudflare addresses, and direct HTTPS requests to them return the site and sitemap. This environment’s default resolver returned `NXDOMAIN` during the audit; recheck with affected visitors’ resolvers if they report access problems.

After this PR deploys, duplicate `www` responses will receive an HTTP `301` to the apex host, preserving path and query. HTTP requests will receive an HTTPS `301`. The old `github.io` hostname is outside this Cloudflare zone, so its GitHub Pages response cannot use a Cloudflare server redirect. After this PR deploys, its pages will issue a path-preserving client-side redirect to the new domain as a fallback; Google recommends server-side permanent redirects where the platform allows them and client-side redirects only when it does not ([site-move guide](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)). The old page also retains a canonical URL to its matching new-domain page.

After deployment, verify redirects and sitemap through both DNS and HTTPS, add and verify `tonypark.dev` in Search Console, submit `https://tonypark.dev/sitemap.xml`, and monitor indexing and performance for both properties. Search Console ownership and the change-of-address workflow are account-level steps and were not checked in this audit. A domain or hosting move can cause temporary ranking changes while Google recrawls and reindexes; hosting on Cloudflare alone has no automatic ranking boost.
