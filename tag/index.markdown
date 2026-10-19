---
layout: default
title: Tags list
---

<h2 class="post_title">{{page.title}}</h2>

<ul class="tag_box inline">
    {% assign tags_list = site.tags | sort %}

    {% for tag in tags_list %}
        {%- assign tag_page = site.pages | where: "tag", tag[0] | first %}
        <li>{% if tag_page %}<a href="{{ BASE_PATH }}/tag/{{ tag[0] }}">{{ tag[0] }}</a>{% else %}{{ tag[0] }}{% endif %} <span> ... {{ tag[1].size }}</span></li>
    {% endfor %}
</ul>