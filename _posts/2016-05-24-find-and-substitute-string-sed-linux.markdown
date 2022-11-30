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

Attention! The previous command finds files also in the hidden folders and if you're working with [Subversion](/tag/subversion) or [GIT](/tag/git) you'd like to skip them. The [following keys](https://askubuntu.com/a/318211/7484) `-not -path '*/\.*'` makes the trick

```bash
find . -not -path '*/\.*' -type f -print0 | xargs -0 sed -i 's/old_phrase/new_phrase/g'
```

For MacOS users the command would be, note the `sed -i ''`

```bash
find . -not -path '*/\.*' -type f -print0 | xargs -0 sed -i '' 's/old_phrase/new_phrase/g'
```

Note. MacOS ships the BSD sed. In linux you run the GNU sed. More around it https://stackoverflow.com/questions/7573368/in-place-edits-with-sed-on-os-x

Beautiful visual explanation of shell commands https://explainshell.com/explain?cmd=find+.+-not+-path+%27*%2F%5C.*%27+-type+f+-print0+%7C+xargs+-0+sed+-i+%27s%2Fold_phrase%2Fnew_phrase%2Fg%27

