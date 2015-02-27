---
layout: post
title:  "Subversion commands"
description: "Simple tips to manipulate subversion `.svn` folder and useful commands"
date:   2015-02-24 10:05:45
categories:
- software
tags:
- subversion
- linux
- ubuntu
comments: true
---

Delete recursively the `.svn` directories

{% highlight bash %}
$ rm -rf `find . -type d -name .svn`
{% endhighlight %}

Find files not under the version control

{% highlight bash %}
$ svn status | grep -e ^?
{% endhighlight %}

How to remove all deleted files from repository

{% highlight bash %}
$ svn st | grep '^!' | awk '{print $2}' | xargs svn delete --force
{% endhighlight %}

`grep` on folder with excluding of `.svn` dirs

{% highlight bash %}
$ grep -r 'content_graphic' assets/js --exclude=*\.svn*
{% endhighlight %}
