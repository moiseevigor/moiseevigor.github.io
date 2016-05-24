---
layout: post
title:  "Find and substitute the string in all files with `sed` command on GNU/Linux"
description: "Small and powerful command to find and substitute the string in all files and directories with `sed` command on GNU/Linux"
date:   2016-05-24 10:05:45
categories:
- software
tags:
- ubuntu
- linux
comments: true
---

Small and powerful command to find and substitute the `old_phrase` with the `new_phrase` in 
all files and directories recursively with `sed` command on GNU/Linux

```bash
find . -type f -print0 | xargs -0 sed -i 's/old_phrase/new_phrase/g'
```

Attention! The previous command finds files also in the hidden folders and if you're working with [Subversion](/tag/subversion) or [GIT](/tag/git) you'd like to skip them. The [following keys](http://askubuntu.com/a/318211/7484) `-not -path '*/\.*'` makes the trick

```bash
find . -not -path '*/\.*' -type f -print0 | xargs -0 sed -i 's/old_phrase/new_phrase/g'
```
