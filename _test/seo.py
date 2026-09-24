"""Check a production Jekyll build: python3 _test/seo.py [site directory]."""

import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
from urllib.robotparser import RobotFileParser
from xml.etree import ElementTree as ET


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.tags = []
        self.schemas = []
        self.json_text = None
        self.title = ""
        self.title_count = 0
        self.in_head = False
        self.in_title = False
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if tag == "head":
            self.in_head = True
        if tag == "title" and self.in_head:
            self.in_title = True
            self.title_count += 1
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.json_text = ""

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.json_text is not None:
            self.json_text += data

    def handle_endtag(self, tag):
        if tag == "head":
            self.in_head = False
        if tag == "title":
            self.in_title = False
        if tag == "script" and self.json_text is not None:
            self.schemas.append(json.loads(self.json_text))
            self.json_text = None

    def values(self, tag, key, value, attribute="content"):
        return [a.get(attribute, "") for t, a in self.tags if t == tag and a.get(key) == value]


root = Path(sys.argv[1] if len(sys.argv) > 1 else "_site")
origin = "https://realtonypark.github.io"
errors = []


def check(condition, message):
    if not condition:
        errors.append(message)


pages = {}
indexable = set()
posts = set()
titles = set()
descriptions = set()
for file in sorted(root.rglob("*.html")):
    path = "/" + file.relative_to(root).as_posix()
    path = path.removesuffix("index.html")
    pages[path] = Page(file.read_text())

check(bool(pages), "No HTML pages found; build the site first")
for path, page in pages.items():
    for tag, attrs in page.tags:
        for candidate in attrs.get("srcset", "").split(","):
            if candidate.strip():
                image_path = urlsplit(urljoin(origin + path, candidate.split()[0]))
                if image_path.netloc == urlsplit(origin).netloc:
                    check((root / unquote(image_path.path).lstrip("/")).is_file(),
                          f"{path}: broken srcset {candidate}")
        key = "href" if tag in ("a", "link") else "src" if tag in ("img", "script", "source", "iframe") else None
        if tag == "meta" and (attrs.get("property") == "og:image" or attrs.get("name") == "twitter:image"):
            key = "content"
        if not key or not attrs.get(key):
            continue
        target = urlsplit(urljoin(origin + path, attrs[key]))
        if target.netloc != urlsplit(origin).netloc:
            continue
        file = root / unquote(target.path).lstrip("/")
        check(file.is_file() or (file / "index.html").is_file(), f"{path}: broken {key} {attrs[key]}")
    canonical = page.values("link", "rel", "canonical", "href")
    robots = ",".join(page.values("meta", "name", "robots"))
    is_post = any(t == "article" and "h-entry" in a.get("class", "").split() for t, a in page.tags)
    check(not is_post or "noindex" not in robots, f"{path}: published post is noindex")
    if "noindex" in robots:
        continue
    check(bool(page.title.strip()) and page.title_count == 1, f"{path}: missing or duplicate title")
    check(any(t == "h1" for t, _ in page.tags), f"{path}: missing primary heading")
    check(any(t == "html" and a.get("lang") for t, a in page.tags), f"{path}: missing page language")
    check(len(canonical) == 1, f"{path}: expected one canonical")
    check(canonical == [origin + path] or path == "/posts/" and canonical == [origin + "/"],
          f"{path}: incorrect canonical {canonical}")
    description = page.values("meta", "name", "description")
    title = page.values("meta", "property", "og:title")
    check(len(description) == 1 and bool(description[0].strip()), f"{path}: missing description")
    check(bool(title), f"{path}: missing social title")
    check(page.values("meta", "property", "og:url") == canonical, f"{path}: social URL mismatch")
    check(bool(page.values("meta", "name", "viewport")), f"{path}: missing viewport")
    if canonical == [origin + path]:
        indexable.add(origin + path)
        check(page.title not in titles, f"{path}: duplicate title")
        check(tuple(description) not in descriptions, f"{path}: duplicate description")
        titles.add(page.title)
        descriptions.add(tuple(description))
    articles = [s for s in page.schemas if s.get("@type") == "BlogPosting"]
    check(not is_post or len(articles) == 1, f"{path}: missing or duplicate article schema")
    if articles:
        posts.add(origin + path)
        check(len(articles) == 1, f"{path}: duplicate article schema")
        article = articles[0]
        check(article.get("author", {}).get("url") == origin + "/about/", f"{path}: missing author URL")
        check(article.get("datePublished") and article.get("dateModified"), f"{path}: missing article dates")
        check(article.get("mainEntityOfPage", {}).get("@id") == origin + path, f"{path}: article URL mismatch")
        images = [a for t, a in page.tags if t == "img"]
        if images:
            check(images[0].get("fetchpriority") == "high", f"{path}: first image not prioritized")
            check(all(a.get("loading") in ("lazy", "eager") for a in images[1:]), f"{path}: missing deferred image loading")

sitemap = root / "sitemap.xml"
check(sitemap.is_file(), "Missing sitemap.xml")
if sitemap.is_file():
    urls = [node.text for node in ET.parse(sitemap).iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
    check(len(urls) == len(set(urls)), "Duplicate sitemap URLs")
    check(set(urls) == indexable, f"Sitemap mismatch: {set(urls) ^ indexable}")
robots = root / "robots.txt"
check(robots.is_file() and f"Sitemap: {origin}/sitemap.xml" in robots.read_text(), "Missing sitemap discovery in robots.txt")
if robots.is_file():
    rules = RobotFileParser()
    rules.parse(robots.read_text().splitlines())
    for url in indexable:
        check(rules.can_fetch("Googlebot", url) and rules.can_fetch("*", url), f"Robots.txt blocks {url}")
feed = ET.parse(root / "feed.xml")
feed_urls = {node.attrib["href"] for node in feed.findall("{http://www.w3.org/2005/Atom}entry/{http://www.w3.org/2005/Atom}link") if node.get("rel") == "alternate"}
check(bool(feed_urls) and feed_urls <= posts, "Feed contains missing or noncanonical posts")
check(bool(posts), "No published posts found")
for path in ("/holdings/", "/publications/", "/grad.html", "/404.html"):
    check(path in pages and "noindex" in ",".join(pages[path].values("meta", "name", "robots")), f"{path}: missing noindex")
for file in ("README.md", "CLAUDE.md", "AGENTS.md", "SEO-AUDIT.md", "new_post.py", "new_syllabus.py", "update-pdfs.py", "no-dot-xml.py", "Gemfile", "Gemfile.lock", "package.json", "graphify-out"):
    check(not (root / file).exists(), f"Development file published: {file}")

if errors:
    sys.exit("\n".join(errors))
print(f"SEO checks passed: {len(pages)} HTML pages, {len(posts)} posts, {len(indexable)} canonical indexable URLs")
