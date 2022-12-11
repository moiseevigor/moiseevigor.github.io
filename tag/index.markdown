---
layout: default
title: Tags list
---

<h2 class="post_title">{{page.title}}</h2>

<ul class="tag_box inline">
    {% assign tags_list = site.tags | sort %}

    {% for tag in tags_list %}
        <li><a href="{{ BASE_PATH }}/tag/{{ tag[0] }}">{{ tag[0] }}</a> <span> ... {{ tag[1].size }}</span></li>
    {% endfor %}
</ul>