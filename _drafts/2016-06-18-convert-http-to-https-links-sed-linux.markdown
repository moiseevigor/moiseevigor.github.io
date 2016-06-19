---
layout: post
title:  "Convert your sitelinks to https in template files with `sed`"
description: "Convert your sitelinks from http to https in template files with `sed` command on GNU/Linux"
date:   2016-06-18 10:05:45
categories:
- software
tags:
- https
- ubuntu
- linux
comments: true
---

I've wrote before the small post on how to [find and substitute the string in all files with `sed` command on GNU/Linux](http://moiseevigor.github.io/software/2016/05/24/find-and-substitute-string-sed-linux/).
now I'd like to show a real use case. When you've bought the SSL certificate and configured your web server,
you'd make an unfortunate discover when you open the browser with you brand new `https://example.com`


Small and powerful command to find and substitute the `old_phrase` with the `new_phrase` in
all files and directories recursively with `sed` command on GNU/Linux

```bash
find . -type f -print0 | xargs -0 sed -i 's/old_phrase/new_phrase/g'
```

Attention! The previous command finds files also in the hidden folders and if you're working with [Subversion](/tag/subversion) or [GIT](/tag/git) you'd like to skip them. The [following keys](http://askubuntu.com/a/318211/7484) `-not -path '*/\.*'` makes the trick

```bash
find . -not -path '*/\.*' -type f -print0 | xargs -0 sed -i 's/old_phrase/new_phrase/g'
```


find . -type f -print0 | xargs -0 sed -i 's/http:\/\//https:\/\//g'
