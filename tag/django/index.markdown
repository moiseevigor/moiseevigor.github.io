---
layout: default
title: Django tagged articles
tag: django
---

<div style="float: left; margin: 2.0rem;">
	<img src="/public/images/{{ page.tag }}.png" style="max-width: 10rem;" alt="{{ page.tag }}" />
</div>

[Django](https://www.djangoproject.com/) is a high-level [Python](/tag/python) Web framework that encourages rapid development and clean, pragmatic design. 

Built by experienced developers, it takes care of much of the hassle of Web development, so you can focus on writing your app without needing to reinvent the wheel. It’s free and open source.

{% include tagged_posts_list.html %}

{% include discus.html %}
