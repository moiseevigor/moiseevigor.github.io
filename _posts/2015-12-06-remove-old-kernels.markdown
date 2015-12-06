---
layout: post
title:  "Remove old kernels in Ubuntu"
description: "Handy command to remove old kernels in Ubuntu"
date:   2015-12-06 10:05:45
categories:
- software
tags:
- linux
- ubuntu
comments: true
---

To remove old linux kernels and leave the current one

```
dpkg -l 'linux-*' | sed '/^ii/!d;/'"$(uname -r | sed "s/\(.*\)-\([^0-9]\+\)/\1/")"'/d;s/^[^ ]* [^ ]* \([^ ]*\).*/\1/;/[0-9]/!d' | xargs sudo apt-get -y purge
```

Be aware, the command uses `uname -r` to get the current kernel.

