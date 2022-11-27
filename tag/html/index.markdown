---
layout: default
title: HTML tagged articles
tag: html
---

<div style="float: left; margin: 2.0rem;">
	<img src="/public/images/{{ page.tag }}.png" style="max-width: 10rem;" alt="{{ page.tag }}" />
</div>

[`HTML`](https://www.w3.org/html/) is the language that describes the structure and the semantic content of a web document. Content within a web page is tagged with `HTML` elements such as `<img>` , `<title>` , `<p>` , `<div>` , `<picture>` , and so forth. These elements form the building blocks of a website.


Web browsers can read `HTML` files and compose them into visible or audible web pages. Browsers do not display the `HTML` tags and scripts, but use them to interpret the content of the page. `HTML` describes the structure of a website semantically along with cues for presentation, making it a markup language, rather than a programming language.

{% include tagged_posts_list.html %}

{% include discus.html %}
