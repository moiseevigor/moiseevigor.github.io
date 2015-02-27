---
layout: post
title:  "Encode string to HTML entities via jQuery"
description: "How-to encode string that may contain HTML into HTML entities with jQuery"
date:   2015-02-27 18:05:45
categories:
- programming
tags:
- jquery
- html
- javascript
comments: true
---

The follwoing will encode your string to `HTML` entities 

{% highlight javascript %}
jQuery('<div />').text('Some text with <div>html</div>').html()
{% endhighlight %}

and the output will look like

{% highlight javascript %}
"Some text with &lt;div&gt;html&lt;/div&gt;"
{% endhighlight %}

To decode we just switch methods

{% highlight javascript %}
jQuery('<div />').html('Some text with &lt;div&gt;html&lt;/div&gt;').text()
{% endhighlight %}

produces

{% highlight html %}
"Some text with <div>html</div>"
{% endhighlight %}

The [jQuery](/tag/jquery) magic!
