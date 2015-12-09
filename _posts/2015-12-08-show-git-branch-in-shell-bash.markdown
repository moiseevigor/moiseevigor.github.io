---
layout: post
title:  "Show git branch in the bash command prompt"
description: "Handy command how to show the current branch in the command prompt of your bash shell"
date:   2015-12-08 10:05:45
categories:
- software
tags:
- linux
- ubuntu
- git
comments: true
---

When you install `git` on your computer, you may find new variables available in the environment, it is `$(__git_ps1)`.
This variable contains the branch name of the current repository. The only thing you need to edit `~/.bashrc`
and add `$(__git_ps1)` to the `PS1` definition in this way

```
if [ "$color_prompt" = yes ]; then
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]$(__git_ps1)\$ '
else
    PS1='${debian_chroot:+($debian_chroot)}\u@\h:\w$(__git_ps1)\$ '
fi
```

*N.B.* the `$(__git_ps1)` is available by default for Ubuntu >= 14.04, you may check if it works by just going to any git
repository and run `echo $(__git_ps1)`

```
~/Work/moiseevigor.github.io $ echo $(__git_ps1);
(master)
``` 

If you see an empty string, so just source it from `/etc/bash_completion.d/git`, and in this case the `~/.bashrc` will look like 


```
source /etc/bash_completion.d/git

if [ "$color_prompt" = yes ]; then
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]$(__git_ps1)\$ '
else
    PS1='${debian_chroot:+($debian_chroot)}\u@\h:\w$(__git_ps1)\$ '
fi
```

This is it, now you have a gorgeous prompt

```
:~/moiseevigor.github.io (master)$ 
```

Have a nice branching!