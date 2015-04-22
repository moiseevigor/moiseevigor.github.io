---
layout: post
title:  "Manipulate array in Javascript"
description: ""
date:   2015-04-27 18:05:45
categories:
- programming
tags:
- jquery
- html
- javascript
comments: true
---

{% highlight javascript %}
/*
 * Helper functions
 */
var ArrayIndexOf = function(a, fnc) {
    if (!fnc || typeof (fnc) != 'function') {
        return -1;
    }
    if (!a || !a.length || a.length < 1) return -1;
    for (var i = 0; i < a.length; i++) {
        if (fnc(a[i])) return i;
    }
    return -1;
};

var ArrayRemove = function(a, from, to) {
  var rest = a.slice((to || from) + 1 || a.length);
  a.length = from < 0 ? a.length + from : from;
  return a.push.apply(a, rest);
};
{% endhighlight %}
