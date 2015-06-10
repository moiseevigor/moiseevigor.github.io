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

Create a new project on Gitlab: `http://\<gitlab-address\>/projects/new` and clone it into your local machine

```
git svn clone http://<svn-address>/<projectname>
cd <projectname>
git remote add origin git@gitlab.newentity.it:newentity-sas/<projectname>.git
git push -u origin master
```

Now backup your `SVN` project folder 


```
cp -raux <projectname> <projectname>.`date +'%Y%m%d'`
```

And remove `.svn` folders

```
cd <projectname>
rm -rf `find . -type d -name .svn`
```

Init `GIT`

```
git init
```

Config `GIT`

```
git config --global user.name "Full Name"
git config --global user.email "Email@example.com"
```

Check the remote `url`

```
git config remote.origin.url
```

Change the remote `origin`

```
git config remote.origin.url git@<gitlab-url>:<username>/<projectname>.git
```

Create a `.gitignore` file

```
echo "<projectname>.sublime*" > .gitignore
```

Add files

```
git add .
```

Commit il progetto

```
git commit -m "init <projectname>"
[master 820fe97] init <projectname>
```

Pull and merge from remote

```
git pull
```

Push into `remote`

```
git push -u origin master
```