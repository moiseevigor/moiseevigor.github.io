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

Apache's handy [`mod_rewrite`](http://httpd.apache.org/docs/current/mod/mod_rewrite.html) module is helping to correct this unfortunate human typos.

At first let's check whether the Apache's `mod_rewrite` is enabled. 


{% highlight bash %}
# a2enmod rewrite
Module rewrite already enabled
{% endhighlight %}

If it was not, then reload configuration 

{% highlight bash %}
# service apache2 reload
 * Reloading web server config apache2                      [OK]
{% endhighlight %}


to assure that the rewrite will work you need to assure the one more thing, it is `AllowOverride` 
option in the `VirtualHost` configuration

{% highlight bash %}
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
{% endhighlight %}


Now put the following snippet into `.htaccess` located in the folder of your website (`/var/www/example.com/htdocs`)

{% highlight bash %}
RewriteEngine On

# remove trailing slash
RewriteCond %{HTTPS} off
RewriteRule ^(.+[^/])/$ http://%{HTTP_HOST}/$1 [R=301,L]
RewriteCond %{HTTPS} on
RewriteRule ^(.+[^/])/$ https://%{HTTP_HOST}/$1 [R=301,L]
{% endhighlight %}


That's it, happy re-writing! 