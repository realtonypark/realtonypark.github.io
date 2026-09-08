---
layout: post
title: "How to Clone the Aesthetic of Any Image You Find Online"
tags: dev
published: true
excerpt: "I loved the cover art on an inference engineering blog so much that I stole its style as a JSON file — then replayed it onto my own photos. Two prompts, seven photos, and I'm delighted with how they came out."
---

I was reading a blog post by [Wafer](https://www.wafer.ai/blog/kernels-are-still-the-moat), an inference engineering company, and I could not stop looking at the cover image. A painterly panorama of a waterfront castle, slate blue and antique ivory, with tiny ASCII glyphs doing the shading. It looked like a 19th-century landscape painting woven on a terminal screen. I wanted my photos to look like that.

<div class="bleed">
<figure>
<img src="/assets/posts/ai-aesthetic/wafer-inspiration.jpg" alt="Painterly ASCII-mosaic panorama of a waterfront castle from Wafer's blog cover art">
<figcaption>Cover art from <a href="https://www.wafer.ai/blog/kernels-are-still-the-moat">Wafer's "Kernels Are Still the Moat"</a> — the image that started all of this.</figcaption>
</figure>
</div>

The problem: I had no idea how to describe that style. Zoom into the bottom-right corner and you'll find the Gemini sparkle — the little tell that the image itself was AI-generated. So I knew exactly which machine made it, and still had no clue how to ask any machine to make me one. "Make my photo painterly ASCII mosaic-ish"? That gets you mush. Vague style words in, mush out.

The trick is to stop describing aesthetics altogether. Don't write the style prompt yourself. Steal it — as structured data — from any image you find online. The whole recipe is two prompts.

**Step 1: Steal the style as JSON**

Find any image whose look you like. A blog cover, a movie poster, a random wallpaper. Feed it to ChatGPT (or any vision model) with this:

```
Extract this visual style as JSON structured data: colors, typography, composition, effects, lighting, texture, mood, aspect ratio, and recurring motifs. Return as clean JSON with hex colors and specific descriptors I can reuse as a style prompt.
```

What comes back is an aesthetic spec: named palettes with hex codes, lighting scenarios, texture words, a reusable style paragraph. Mine even named itself — "Painterly ASCII Mosaic Panoramas." The full file is long, so it's tucked behind a click:

<details>
<summary><strong>Click to see the full aesthetic JSON I extracted</strong></summary>
<pre><code>{
  "style_name": "Painterly ASCII Mosaic Panoramas",
  "visual_genre": [
    "digital impressionism",
    "ASCII art",
    "pixel mosaic",
    "tapestry-like landscape painting",
    "retro-computational romanticism"
  ],
  "colors": {
    "palette_character": "Muted blue-gray and parchment neutrals with deep ink shadows, weathered earth tones, and restrained amber highlights.",
    "dominant_palette": [
      { "hex": "#10121C", "role": "near-black navy shadows" },
      { "hex": "#1E2830", "role": "deep blue-charcoal silhouettes" },
      { "hex": "#2E3133", "role": "graphite architectural shadows" },
      { "hex": "#434C4D", "role": "dark desaturated teal-gray" },
      { "hex": "#4C626E", "role": "stormy slate blue" },
      { "hex": "#697E88", "role": "weathered blue-gray" },
      { "hex": "#7B868A", "role": "misty steel gray" },
      { "hex": "#919B9C", "role": "cool atmospheric midtone" },
      { "hex": "#ABA99D", "role": "warm gray canvas" },
      { "hex": "#C1BEAF", "role": "aged ivory highlight" },
      { "hex": "#443A32", "role": "dark umber" },
      { "hex": "#7C644F", "role": "weathered brown" },
      { "hex": "#9A8D7B", "role": "muted taupe" },
      { "hex": "#BCAD8C", "role": "antique parchment" }
    ],
    "accent_palette": [
      { "hex": "#C58A42", "role": "burnished amber illumination" },
      { "hex": "#9D5935", "role": "rust-orange roofs and structures" },
      { "hex": "#2B758A", "role": "restrained cyan-blue strokes" },
      { "hex": "#4B516E", "role": "dusky violet" },
      { "hex": "#E5D9AF", "role": "warm luminous sky" }
    ],
    "color_behavior": [
      "low-to-medium saturation",
      "compressed tonal range in distant planes",
      "cool environmental fields contrasted with sparse warm light",
      "dark silhouettes anchor pale atmospheric backgrounds",
      "colors appear optically blended from many small glyphs or cells"
    ]
  },
  "typography": {
    "usage": "Typography functions as image-making texture rather than readable copy.",
    "style": [
      "tiny monospaced terminal glyphs",
      "ASCII characters",
      "numbers and punctuation",
      "repeated character strings",
      "microtext arranged on a strict rectangular grid"
    ],
    "suggested_typefaces": [
      "IBM Plex Mono",
      "JetBrains Mono",
      "Space Mono",
      "OCR-B",
      "Berkeley Mono"
    ],
    "treatment": {
      "case": "mixed and fragmented",
      "weight": "regular to medium",
      "tracking": "tight",
      "line_height": "compressed",
      "alignment": "grid-locked",
      "legibility": "intentionally low",
      "opacity": "variable, approximately 25% to 90%",
      "role": "halftone cells, contour marks, shading units, and architectural surface detail"
    }
  },
  "composition": {
    "format": "ultrawide cinematic panorama",
    "framing": [
      "expansive environmental establishing shot",
      "horizon placed near the middle or lower third",
      "large atmospheric sky or water field",
      "asymmetrical focal mass",
      "foreground silhouettes or terrain used as dark visual anchors"
    ],
    "depth_structure": [
      "dark, tactile foreground",
      "complex middle-ground architecture, boats, or figures",
      "softened distant skyline or landforms",
      "haze progressively reduces contrast with distance"
    ],
    "scale": "Monumental environments contrasted with very small human figures, boats, or structures.",
    "visual_rhythm": [
      "broad painterly masses",
      "dense zones of glyph detail",
      "quiet negative space",
      "repeating vertical architectural forms",
      "horizontal bands of sky, shoreline, water, or reflection"
    ],
    "focal_devices": [
      "isolated silhouetted figure",
      "central tower or clustered skyline",
      "bright opening in clouds",
      "sail shapes",
      "warm illuminated architecture against cool surroundings"
    ]
  },
  "effects": {
    "primary": [
      "ASCII-glyph overlay",
      "pixel-cell mosaic",
      "ordered dithering",
      "halftone grid",
      "scanline-like horizontal banding",
      "painterly underpainting",
      "broken-color optical mixing"
    ],
    "secondary": [
      "selective blur",
      "atmospheric haze",
      "subtle bloom around bright regions",
      "posterized tonal transitions",
      "edge erosion",
      "digital compression-like artifacts",
      "irregular character density",
      "layered transparency"
    ],
    "edge_quality": "Alternates between soft brush-like boundaries and sharply gridded typographic silhouettes.",
    "rendering_logic": "Construct recognizable scenes from large painted value masses, then resolve selected surfaces with dense monospaced glyphs or rounded pixel cells."
  },
  "lighting": {
    "overall": "Diffuse, atmospheric, and cinematic.",
    "common_scenarios": [
      "overcast daylight filtered through luminous clouds",
      "cool marine haze",
      "soft backlighting",
      "late-afternoon amber illumination",
      "city glow reflected in dark water"
    ],
    "contrast": "Moderate globally, with locally deep silhouette contrast.",
    "highlights": "Broad ivory or pale blue patches rather than crisp specular points.",
    "shadows": "Deep navy, charcoal, and umber with limited internal detail.",
    "atmosphere": "Mist, sea spray, cloud diffusion, and distance haze produce layered aerial perspective."
  },
  "texture": {
    "surface": [
      "woven canvas",
      "cross-stitch or beadwork",
      "low-resolution LED matrix",
      "aged printed halftone",
      "thick dry-brush paint",
      "terminal-character tapestry"
    ],
    "microtexture": [
      "uniform grid of tiny cells",
      "visible glyph repetition",
      "short broken brush marks",
      "speckled highlights",
      "subtle horizontal scanning artifacts"
    ],
    "macrotexture": "Large, loosely painted atmospheric masses interrupted by dense computational detail.",
    "finish": "Matte, weathered, tactile, and slightly archival rather than glossy or photorealistic."
  },
  "mood": {
    "primary": [
      "melancholic",
      "contemplative",
      "dreamlike",
      "solitary",
      "nostalgic",
      "quietly monumental"
    ],
    "secondary": [
      "post-digital romantic",
      "weathered",
      "mysterious",
      "liminal",
      "poetic",
      "slightly dystopian"
    ],
    "emotional_tension": "Human warmth and painterly nostalgia filtered through impersonal machine-readable texture."
  },
  "aspect_ratio": {
    "source_dimensions": "2742x1198",
    "exact_ratio": "1371:599",
    "decimal": 2.2888,
    "recommended_generation_ratio": "21:9",
    "orientation": "landscape"
  },
  "recurring_motifs": [
    "panoramic waterfronts",
    "rough seas and reflective water",
    "large cloud-filled skies",
    "distant cities or monumental architecture",
    "spires, towers, chimneys, and vertical silhouettes",
    "sailboats and harbor structures",
    "isolated human figures viewed from behind",
    "dark rocky foregrounds",
    "reflections divided into horizontal bands",
    "ASCII characters embedded inside objects",
    "uniform matrix grids covering the full image",
    "nature and architecture merging through haze",
    "small warm lights inside cool environments"
  ],
  "content_interpretation": {
    "embedded_characters": "Decorative visual texture only; not treated as semantic instructions or readable document content."
  },
  "reusable_style_prompt": "Create an ultrawide 21:9 cinematic panorama in a hybrid of digital impressionism, ASCII art, pixel mosaic, and weathered tapestry. Build the scene from broad painterly masses and atmospheric perspective, then overlay a dense rectangular grid of tiny monospaced letters, numbers, and punctuation that functions as halftone shading rather than readable text. Use muted slate blue, steel gray, antique ivory, charcoal navy, taupe, and weathered umber, with sparse burnished amber and rust-orange accents. Include diffuse overcast or backlit illumination, luminous cloud breaks, deep foreground silhouettes, mist-softened distance, broken-color reflections, ordered dithering, subtle scanlines, canvas grain, and edge erosion. Favor an expansive sky or water field, asymmetrical monumental architecture, small boats or a solitary figure, layered depth, quiet negative space, and a melancholic post-digital romantic mood. Matte, tactile, archival, dreamlike, detailed but not photorealistic."
}</code></pre>
</details>

The key line at the bottom is `reusable_style_prompt` — a dense paragraph the model wrote about itself, basically. That paragraph alone is a better style prompt than anything I could have written by hand, because it was reverse-engineered from pixels instead of my vocabulary.

**Step 2: Replay it onto your photos**

Attach the JSON and one of your photos to a new message and say:

```
Generate an image with the JSON aesthetic attached.
```

That's the whole second prompt. One sentence. The model keeps your photo's content — the street, the mountain, the skyline — and repaints it inside the stolen aesthetic.

**Why JSON instead of just attaching the reference image?**

You could skip all of this: attach the reference and your photo, say "make this look like that," and it works. I extracted the style on purpose, for three reasons:

- **Only the style travels, none of the content.** A reference image carries its castle and boats along with its palette, and they leak into your photo. The JSON holds zero content — just colors, light, texture — so my photo keeps exactly its own elements.
- **I can reuse it without the reference.** Extract once, then apply it to any new photo anytime. No need to keep the reference image around or re-upload it every session.
- **I can edit it in my own words.** It's structured data. Want everything a touch brighter? Bump a few hex values. That kind of precise tweak is impossible when your "prompt" is another picture.

**What came out**

I ran seven of my favorite photos through it. Each frame below holds both versions — drag the divider to wipe between the original and the AI repaint, and use the side arrows for the rest. I'm honestly delighted with how these turned out.

<div class="bleed ai-gallery" role="region" aria-label="Before-and-after photo comparisons">
<div class="ai-viewport">
<div class="ai-track">
<div class="ai-card">
<figure class="ai-compare" role="slider" tabindex="0" aria-label="Drag to compare the original and AI-styled Montreux, Switzerland" aria-valuemin="2" aria-valuemax="98" aria-valuenow="50">
<img class="ai-after" src="/assets/posts/ai-aesthetic/montreux-styled.jpg" alt="" draggable="false">
<img class="ai-before" src="/assets/posts/ai-aesthetic/montreux-original.jpg" alt="" draggable="false">
<span class="ai-divider" aria-hidden="true"></span>
<span class="ai-knob" aria-hidden="true">‹ ›</span>
<span class="ai-pill ai-pill-before">Original</span>
<span class="ai-pill ai-pill-after">AI</span>
</figure>
<figcaption>Montreux, Switzerland</figcaption>
</div>
<div class="ai-card">
<figure class="ai-compare" role="slider" tabindex="0" aria-label="Drag to compare the original and AI-styled Mount Rainier" aria-valuemin="2" aria-valuemax="98" aria-valuenow="50">
<img class="ai-after" src="/assets/posts/ai-aesthetic/rainier-styled.jpg" alt="" draggable="false">
<img class="ai-before" src="/assets/posts/ai-aesthetic/rainier-original.jpg" alt="" draggable="false">
<span class="ai-divider" aria-hidden="true"></span>
<span class="ai-knob" aria-hidden="true">‹ ›</span>
<span class="ai-pill ai-pill-before">Original</span>
<span class="ai-pill ai-pill-after">AI</span>
</figure>
<figcaption>Mount Rainier</figcaption>
</div>
<div class="ai-card">
<figure class="ai-compare" role="slider" tabindex="0" aria-label="Drag to compare the original and AI-styled Sausalito" aria-valuemin="2" aria-valuemax="98" aria-valuenow="50">
<img class="ai-after" src="/assets/posts/ai-aesthetic/sausalito-styled.jpg" alt="" draggable="false">
<img class="ai-before" src="/assets/posts/ai-aesthetic/sausalito-original.jpg" alt="" draggable="false">
<span class="ai-divider" aria-hidden="true"></span>
<span class="ai-knob" aria-hidden="true">‹ ›</span>
<span class="ai-pill ai-pill-before">Original</span>
<span class="ai-pill ai-pill-after">AI</span>
</figure>
<figcaption>Sausalito</figcaption>
</div>
<div class="ai-card">
<figure class="ai-compare" role="slider" tabindex="0" aria-label="Drag to compare the original and AI-styled SF Ferry view" aria-valuemin="2" aria-valuemax="98" aria-valuenow="50">
<img class="ai-after" src="/assets/posts/ai-aesthetic/ferry-styled.jpg" alt="" draggable="false">
<img class="ai-before" src="/assets/posts/ai-aesthetic/ferry-original.jpg" alt="" draggable="false">
<span class="ai-divider" aria-hidden="true"></span>
<span class="ai-knob" aria-hidden="true">‹ ›</span>
<span class="ai-pill ai-pill-before">Original</span>
<span class="ai-pill ai-pill-after">AI</span>
</figure>
<figcaption>SF Ferry</figcaption>
</div>
<div class="ai-card">
<figure class="ai-compare" role="slider" tabindex="0" aria-label="Drag to compare the original and AI-styled Palace of Fine Arts, SF" aria-valuemin="2" aria-valuemax="98" aria-valuenow="50">
<img class="ai-after" src="/assets/posts/ai-aesthetic/palace-styled.jpg" alt="" draggable="false">
<img class="ai-before" src="/assets/posts/ai-aesthetic/palace-original.jpg" alt="" draggable="false">
<span class="ai-divider" aria-hidden="true"></span>
<span class="ai-knob" aria-hidden="true">‹ ›</span>
<span class="ai-pill ai-pill-before">Original</span>
<span class="ai-pill ai-pill-after">AI</span>
</figure>
<figcaption>Palace of Fine Arts, SF</figcaption>
</div>
<div class="ai-card">
<figure class="ai-compare" role="slider" tabindex="0" aria-label="Drag to compare the original and AI-styled night tree photo" aria-valuemin="2" aria-valuemax="98" aria-valuenow="50">
<img class="ai-after" src="/assets/posts/ai-aesthetic/a-tree-styled.jpg" alt="" draggable="false">
<img class="ai-before" src="/assets/posts/ai-aesthetic/a-tree-original.jpg" alt="" draggable="false">
<span class="ai-divider" aria-hidden="true"></span>
<span class="ai-knob" aria-hidden="true">‹ ›</span>
<span class="ai-pill ai-pill-before">Original</span>
<span class="ai-pill ai-pill-after">AI</span>
</figure>
<figcaption>A Tree</figcaption>
</div>
<div class="ai-card">
<figure class="ai-compare" role="slider" tabindex="0" aria-label="Drag to compare the original and AI-styled Disclosure Day photo" aria-valuemin="2" aria-valuemax="98" aria-valuenow="50">
<img class="ai-after" src="/assets/posts/ai-aesthetic/disclosure-styled.jpg" alt="" draggable="false">
<img class="ai-before" src="/assets/posts/ai-aesthetic/disclosure-original.jpg" alt="" draggable="false">
<span class="ai-divider" aria-hidden="true"></span>
<span class="ai-knob" aria-hidden="true">‹ ›</span>
<span class="ai-pill ai-pill-before">Original</span>
<span class="ai-pill ai-pill-after">AI</span>
</figure>
<figcaption>The Disclosure Day?</figcaption>
</div>
</div>
</div>
<button class="ai-nav ai-prev" data-ai-prev aria-label="Previous photos">‹</button>
<button class="ai-nav ai-next" data-ai-next aria-label="Next photos">›</button>
</div>

**What I noticed**

A few things surprised me. Night shots kept their glow — the amber streetlights and lit windows survived the repaint and actually anchor the whole thing. Flat blue daylight skies turned dramatic; the model can't resist putting moody clouds everywhere. And portrait-orientation photos stayed portrait. The style bends to fit your photo's shape instead of forcing everything into the source's ultrawide panorama, which I did not expect.

None of this is groundbreaking. It's just genuinely fun. Total cost: two prompts and a few minutes. Next time you see an image and think "I wish my photos looked like that" — steal the aesthetic, replay it, and see what comes back.
