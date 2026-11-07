---
layout: page
title: Posts by Topic
---

Sort by: [date]({{ site.baseurl }}{% link index.md %}) \| [**tag**]({{ site.baseurl }}{% link posts-by-tag.md %})

<ul class="tag-list">
{% assign all_tags = site.tags | sort %}
{% for tag in all_tags %}
{% assign visible = tag[1] | where_exp: "post", "post.unlisted != true" %}
{% if visible != empty %}
{% assign size_pct = visible | size | times: 20 | plus: 80 %}
<li class="tag-link" style="font-size: {{size_pct}}%"> <a href="#{{tag[0]}}">{{tag[0]}} </a> </li>
{% endif %}
{% endfor %}
</ul>

{% for tag in all_tags %}
{% assign visible = tag[1] | where_exp: "post", "post.unlisted != true" %}
{% if visible != empty %}
## {{ tag[0] }}
  <ul class="post-list by-tag">
    {%- assign date_format = site.minima.date_format | default: "%b %-d, %Y" -%}
    {% for post in visible %}
      <li class="by-tag-item">
        <a class="post-link" href="{{ post.url }}">{{ post.title }}</a>
        <span class="post-meta">{{ post.date | date: date_format }}</span>
      </li>
    {% endfor %}
  </ul>
  <p style="text-align: center;"> <a href="#top"> ↑top </a>
  </p>
{% endif %}
{% endfor %}
