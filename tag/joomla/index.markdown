---
layout: default
title: Joomla tagged articles
tag: joomla
---

<div style="float: left; margin: 2.0rem;">
	<img src="/public/images/{{ page.tag }}.png" style="max-width: 10rem;" alt="{{ page.tag }}" />
</div>

[Joomla](https://www.joomla.org/) is a free and open-source content management system (CMS) for publishing web content. It is built on a model–view–controller web application framework that can be used independently of the CMS.

Joomla is written in [PHP](/tag/php), uses object-oriented programming (OOP) techniques and software design patterns, stores data in a [MySQL](/tag/mysql), MS SQL or PostgreSQL database and includes features such as page caching, RSS feeds, printable versions of pages, news flashes, blogs, polls, search, and support for language internationalization.


{% include tagged_posts_list.html %}

{% include discus.html %}
