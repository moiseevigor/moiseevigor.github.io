---
layout: post
title:  "Apache2: AH01630: client denied by server configuration"
description: "Error on Apache 2.4 start: AH01630: client denied by server configuration"
date:   2015-05-18 18:05:45
categories:
- software
tags:
- apache
- ubuntu
- linux
comments: true
---

The Apache web server of the version `2.4` introduces a new style for `<VirtualHost>` configuration, 
in particular the `<Directory>` syntax is not compatible anymore with the previous one `2.2`. 

The old styled configuration valid in the Apache <= `2.2` version 

{% highlight bash %}
<VirtualHost *:80>

    ...

    <Directory "/var/www/html/example.com/public">
        Options MultiViews FollowSymLinks
        AllowOverride all
        Order allow,deny
        Allow from all
    </Directory>

    ...

</VirtualHost>
{% endhighlight %}

the modification is introduced in the part 

{% highlight bash %}
Order allow,deny
Allow from all
{% endhighlight %}

the new way of describing the access permitions is reduced to one line

{% highlight bash %}
Require all granted
{% endhighlight %}

finally the correct `<VirtualHost>` configuration will look like the following

{% highlight bash %}
<VirtualHost *:80>
    ServerName  www.example.com
    ServerAlias example.com

    DirectoryIndex index.html index.php index.htm
    DocumentRoot /var/www/html/example.com/public

    <Directory "/var/www/html/example.com/public">
        Options MultiViews FollowSymLinks
        AllowOverride all
        Require all granted
    </Directory>

    # Logfiles
    ErrorLog  /var/log/apache2/example.com/error.log
    CustomLog /var/log/apache2/example.com/access.log combined
</VirtualHost>
{% endhighlight %}




