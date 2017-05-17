---
layout: default
title: React tagged articles
tag: react
---

<div style="float: left; margin: 2.0rem;">
	<img src="/public/images/{{ page.tag }}.png" style="max-width: 10rem;" alt="{{ page.tag }}" />
</div>

[React](https://facebook.github.io/react/) is an open-source JavaScript library[2] for building user interfaces.

React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes.

Declarative views make your code more predictable and easier to debug.


Build encapsulated components that manage their own state, then compose them to make complex UIs.

Since component logic is written in JavaScript instead of templates, you can easily pass rich data through your app and keep state out of the DOM.

{% include tagged_posts_list.html %}

{% include discus.html %}
