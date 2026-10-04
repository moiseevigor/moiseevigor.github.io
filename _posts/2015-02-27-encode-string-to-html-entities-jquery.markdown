---
layout: post
title:  "Encode string to HTML entities via jQuery"
description: "How to encode a string that may contain HTML into HTML entities with jQuery"
date:   2015-02-27 18:05:45
categories:
- programming
tags:
- jquery
- html
- javascript
comments: true
---

The following will encode your string to `HTML` entities 

```javascript
jQuery('<div />').text('Some text with <div>html</div>').html()
```

and the output will look like

```javascript
"Some text with &lt;div&gt;html&lt;/div&gt;"
```

To decode we just switch methods

```javascript
jQuery('<div />').html('Some text with &lt;div&gt;html&lt;/div&gt;').text()
```

produces

```javascript
"Some text with <div>html</div>"
```

The [jQuery](/tag/jquery) magic!
