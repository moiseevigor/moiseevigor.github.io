---
layout: post
title:  "Cache Busting using commit hash with GIT and RequireJS"
description: ""
date:   2015-01-23 10:05:45
categories:
- programming
tags:
- git
- requirejs
- linux
comments: true
---

http://stackoverflow.com/questions/8315088/prevent-requirejs-from-caching-required-scripts

```
# cat .git/hooks/post-commit
#!/bin/bash
#
# An example hook script that is called after a successful
# commit is made.
#
# To enable this hook, rename this file to "post-commit".

rev=`git rev-parse HEAD`
echo "// file: web/htdocs/assets/js/moduli/main.js
//
// dipendenze moduli
// NON MODIFICARE! Il file è autogenerato da .git/hooks/post-commit 
//

require.config({waitSeconds: 15, urlArgs: 'ver=$rev'});" > /var/www/cloudpbx/web/htdocs/assets/js/moduli/main.js
```