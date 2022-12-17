---
layout: post
title:  "Convert your sitelinks to https with `sed`"
description: "Convert your sitelinks from http to https with `sed` command on GNU/Linux"
date:   2017-03-14 10:05:45
categories:
- software
tags:
- linux
- unix
comments: true
---

I've wrote before the small post on how to [find and substitute the string in all files with `sed` command in GNU/Linux](https://moiseevigor.github.io/software/2016/05/24/find-and-substitute-string-sed-linux/).
Now I'd like to show the real use case.

You've bought a new SSL certificate and configured your web server.
After you fire it, you can make an unfortunate discover when you open the browser
on your brand new `https://example.com`, that it says “Some parts of this page are not secure”.

So what is insecure? Simply you may have used the insecure contents
like images or external JS libraries loaded from CDN.


To help with this, Linux has a small and powerful command to find and substitute the `old_phrase` with the `new_phrase` in
all files and directories recursively - it is `sed` command on GNU/Linux

```bash
find . -type f -print0 | xargs -0 sed -i 's/old_phrase/new_phrase/g'
```

Attention! The previous command finds files also in the hidden folders and if you're working with [Subversion](/tag/subversion) or [GIT](/tag/git) you'd like to skip them. The [following keys](https://askubuntu.com/a/318211/7484) `-not -path '*/\.*'` makes the trick

```bash
find . -not -path '*/\.*' -type f -print0 | xargs -0 sed -i 's/http:\/\//https:\/\//g'
```

After this command your links like

```html
<img src="https://example.com/dot.png">
```

will be converted to

```html
<img src="https://example.com/dot.png">
```

Happy coding!

<div>
  <img id="ads_logo" alt="ads" src="/public/images/ads.png" style="max-width: 20px;" />
  <div class="image-grid">
    {% include page_tags_list_books.html %}
  </div>
</div>
