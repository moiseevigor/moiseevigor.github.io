---
layout: post
title: Learning NoSQL, PHP and Linux, Part-2
description: Short notes on basics of RESTful Web services and how to develop a solid stateful API in PHP and Slimframework.
header: Categories
group: navigation
permalink: /learning-nosql-php-linux/part-2
group: learning-nosql-php-linux
categories:
- programming
tags:
- php
- linux
- ubuntu
- apache
comments: true
---

<iframe src="//slides.com/igormoiseev/web-service/embed" width="760" height="520" scrolling="no" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## Web Server 

At first install [`Apache`](/tag/apache) web server, we suppose Ubuntu 14.04 installed on server,

{% highlight bash %}
$ sudo apt-get install apache2
{% endhighlight %}

Then let's assume the name of the website is `example.com`, so we configure Apache to serve content for this website from the folder 
`/var/www/html/example.com`

{% highlight bash %}
$ sudo nano /etc/apache2/sites-available/example.com.conf
{% endhighlight %}

And put the `VirtualHost` description 

{% highlight bash %}
<VirtualHost *:80>
    ServerName  www.example.com
    ServerAlias example.com

    DirectoryIndex index.html index.php index.htm
    DocumentRoot /var/www/html/example.com/public

    <Directory "/var/www/html/example.com/public">
        Options MultiViews FollowSymLinks
        AllowOverride all
        Order allow,deny
        Allow from all
    </Directory>

    # Logfiles
    ErrorLog  /var/log/apache2/example.com/error.log
    CustomLog /var/log/apache2/example.com/access.log combined
</VirtualHost>
{% endhighlight %}

Create corresponding folders

{% highlight bash %}
$ sudo mkdir -p /var/www/html/example.com/public /var/log/apache2/example.com/
{% endhighlight %}

and enable the website 

{% highlight bash %}
$ sudo a2ensite 
Your choices are: 000-default default-ssl example.com
Which site(s) do you want to enable (wildcards ok)?
example.com
Enabling site example.com.
To activate the new configuration, you need to run:
  service apache2 reload
{% endhighlight %}

then reload conf 

{% highlight bash %}
$ sudo service apache2 reload
{% endhighlight %}


## PHP Composer

Here we'll see how to create a simple PHP web service with the help of [Composer](https://getcomposer.org/). Composer is a tool for dependency management in PHP. It allows you to declare the dependent libraries your project needs and it will install them in your project for you.

{% highlight bash %}
$ cd /var/www/html & rm -rf example.com
{% endhighlight %}

now clone the source code

{% highlight bash %}
$ /var/www/html$ sudo git clone https://github.com/moiseevigor/learning-nosql-php example.com
{% endhighlight %}

Switch to the folder of the project

{% highlight bash %}
$ cd example.com 
{% endhighlight %}

And switch to "Hello world" branch

{% highlight bash %}
$ git checkout -b hello-world origin/hello-world
{% endhighlight %}

Install composer 

{% highlight bash %}
$ sudo curl -sS https://getcomposer.org/installer | sudo php
{% endhighlight %}

and configure dependences

{% highlight bash %}
$ sudo ./composer.phar install
{% endhighlight %}

The latter will create folder `vendor` in current folder, that will contains all PHP libraries that our project will depend on.

## PHP Server

To run the application just simply switch to `public`

{% highlight bash %}
$ cd public
{% endhighlight %}

and start built-in web server on `localhost`. 

{% highlight bash %}
$ php -S localhost:8080
{% endhighlight %}

Note, the built-in web server is available only for version of `PHP` >5.4.

Now open browser on  `http://localhost:8080/hello/world` or try it via `telnet`


{% highlight bash %}
$ telnet localhost 8080
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
GET /hello/world HTTP/1.1
host: localhost

HTTP/1.1 200 OK
Host: localhost
Connection: close
X-Powered-By: PHP/5.5.9-1ubuntu4.6
Content-Type: text/html

Hello, world
{% endhighlight %}

## Project Learning NoSQL e PHP
Project Learning NoSQL e PHP, https://github.com/moiseevigor/learning-nosql-php, contains a number of branches. 
After previous step we find ourselves at `hello-world` branch. 

{% highlight bash %}
/var/www/html/example.com (models)$ git branch
  master
* hello-world
  controllers
  models
{% endhighlight %}

You need to explore the project in the following order

 - `hello-world`: basic routing and functionality
 - `controllers`: introduction of Controller and advanced routing
 - `models`: introduction of Models and Doctrine ORM

 To switch between branches you need to execute

{% highlight bash %}
$ git checkout -b hello-world origin/hello-world
$ git checkout -b controllers origin/controllers
$ git checkout -b models origin/models
{% endhighlight %}

After every switch you need to update libraries with 

{% highlight bash %}
$ ./composer.phar update
{% endhighlight %}
