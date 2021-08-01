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

```sql
jQuery('<div />').text('Some text with <div>html</div>').html()
```

and the output will look like

```sql
"Some text with &lt;div&gt;html&lt;/div&gt;"
```

To decode we just switch methods

```sql
jQuery('<div />').html('Some text with &lt;div&gt;html&lt;/div&gt;').text()
```

produces

```sql
"Some text with <div>html</div>"
```

The [jQuery](/tag/jquery) magic!
