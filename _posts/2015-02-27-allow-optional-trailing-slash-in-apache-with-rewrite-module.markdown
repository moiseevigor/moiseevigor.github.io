---
layout: post
title:  "Allow optional trailing slash in Apache with Rewrite module"
description: "Allow optional trailing slash when using optional parameter in Apache using Rewrite module"
date:   2015-02-27 19:05:45
categories:
- software
tags:
- apache
- linux
- ubuntu
comments: true
---

Apache's handy [`mod_rewrite`](https://httpd.apache.org/docs/current/mod/mod_rewrite.html) module is helping to correct this unfortunate human typos.

At first let's check whether the Apache's `mod_rewrite` is enabled. 


```bash
# a2enmod rewrite
Module rewrite already enabled
```

If it was not, then reload configuration 

```bash
# service apache2 reload
 * Reloading web server config apache2                      [OK]
```


to assure that the rewrite will work you need to assure the one more thing, it is `AllowOverride` 
option in the `VirtualHost` configuration

```bash
<VirtualHost *:80>

...

<Directory /var/www/example.com/htdocs>
        Options FollowSymLinks
        AllowOverride All
        Order allow,deny
        Allow from all
</Directory>

....

</VirtualHost>
```


Now put the following snippet into `.htaccess` located in the folder of your website (`/var/www/example.com/htdocs`)

```bash
RewriteEngine On

# remove trailing slash
RewriteCond %{HTTPS} off
RewriteRule ^(.+[^/])/$ https://%{HTTP_HOST}/$1 [R=301,L]
RewriteCond %{HTTPS} on
RewriteRule ^(.+[^/])/$ https://%{HTTP_HOST}/$1 [R=301,L]
```


That's it, happy re-writing! 