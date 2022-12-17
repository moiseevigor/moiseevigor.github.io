---
layout: default
title: Deep Learning tagged articles
tag: deeplearning
tags:
- machinelearning
- datascience
---

<div style="float: left; margin: 2.0rem;">
	<img src="/public/images/{{ page.tag }}.png" style="max-width: 10rem;" alt="{{ page.tag }}" />
</div>


<p>Deep learning is a class of machine learning algorithms that uses multiple layers to progressively extract higher-level features from the raw input.</p>

<p>For example, in image processing, lower layers may identify edges, while higher layers may identify the concepts relevant to a human such as digits or letters or faces.</p>

{% include tagged_posts_list.html %}
