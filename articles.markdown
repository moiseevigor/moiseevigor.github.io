---
layout: page
title: Articles
header: Articles
group: navigation
permalink: /articles/
comments: false
---

Mathematical articles and manuscript companions behind the blog programs.
Companion pages explain selected results and their hypotheses; their linked
manuscripts contain the complete statements and proofs. Each page distinguishes
proved results, numerical evidence, and open questions.

{% assign articles_sorted = site.articles | sort: "date" | reverse %}
{% if articles_sorted.size > 0 %}
<ul class="posts">
  {% for article in articles_sorted %}
  {% if article.published != false or jekyll.environment == "development" %}
  <li>
    <span class="post-date">{{ article.date | date: "%-d %b %Y" }}</span>
    <a href="{{ article.url }}">{{ article.title }}</a>
    {% if article.subtitle %}<p style="margin:4px 0 0; color:var(--text-muted,#777); font-size:0.92em;">{{ article.subtitle }}</p>{% endif %}
  </li>
  {% endif %}
  {% endfor %}
</ul>
{% else %}
<p><em>No articles yet.</em></p>
{% endif %}
