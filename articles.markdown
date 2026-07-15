---
layout: page
title: Articles
header: Articles
group: navigation
permalink: /articles/
comments: false
---

Long-form mathematical articles: complete statements, hypotheses, and proofs
behind the blog series. A blog post shows the result and the experiment; the
article carries the full derivation, the fine print, and an honest ledger of
what is proven, what is measured, and what remains open.

{% assign articles_sorted = site.articles | sort: "date" | reverse %}
{% if articles_sorted.size > 0 %}
<ul class="posts">
  {% for article in articles_sorted %}
  <li>
    <span class="post-date">{{ article.date | date: "%-d %b %Y" }}</span>
    <a href="{{ article.url }}">{{ article.title }}</a>
    {% if article.subtitle %}<p style="margin:4px 0 0; color:var(--text-muted,#777); font-size:0.92em;">{{ article.subtitle }}</p>{% endif %}
  </li>
  {% endfor %}
</ul>
{% else %}
<p><em>The first articles are in preparation — they will appear here as the
companion series leave draft.</em></p>
{% endif %}
