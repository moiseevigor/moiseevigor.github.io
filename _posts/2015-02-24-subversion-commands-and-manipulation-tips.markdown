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

```bash
$ rm -rf `find . -type d -name .svn`
```

Find files not under the version control

```bash
$ svn status | grep -e ^?
```

How to remove all deleted files from repository

```bash
$ svn st | grep '^!' | awk '{print $2}' | xargs svn delete --force
```

`grep` on folder with excluding of `.svn` dirs

```bash
$ grep -r 'content_graphic' assets/js --exclude=*\.svn*
```
