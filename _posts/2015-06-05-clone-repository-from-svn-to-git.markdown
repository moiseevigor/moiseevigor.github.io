---
layout: post
title:  "Clone repository from Subversion to Git"
description: "Small tutorial on how to clone and migrate whole repository with history from Subversion to Git"
date:   2015-06-05 10:05:45
categories:
- software
tags:
- subversion
- git
- gitlab
- linux
- openssh
comments: true
---

Here we discus how to migrate the Subversion repository into a new Git repository. 
We'll do it with a handy `git svn` utility. We will refer Gitlab/Github as the destination Git server.

Create a new project on Gitlab: `https://\<gitlab-address\>/projects/new` and clone it into your local machine

```bash
git svn clone https://<svn-address>/<projectname>
cd <projectname>
git remote add origin git@gitlab.newentity.it:newentity-sas/<projectname>.git
git push -u origin master
```

Now backup your `SVN` project folder 


```bash
cp -raux <projectname> <projectname>.`date +'%Y%m%d'`
```

And remove `.svn` folders

```bash
cd <projectname>
rm -rf `find . -type d -name .svn`
```

Init `GIT`

```bash
git init
```

Config `GIT`

```bash
git config --global user.name "Full Name"
git config --global user.email "Email@example.com"
```

Check the remote `url`

```bash
git config remote.origin.url
```

Change the remote `origin`

```bash
git config remote.origin.url git@<gitlab-url>:<username>/<projectname>.git
```

Create a `.gitignore` file

```bash
echo "<projectname>.sublime*" > .gitignore
```

Add files

```bash
git add .
```

Commit il progetto

```bash
git commit -m "init <projectname>"
[master 820fe97] init <projectname>
```

Pull and merge from remote

```bash
git pull
```

Push into `remote`

```bash
git push -u origin master
```
