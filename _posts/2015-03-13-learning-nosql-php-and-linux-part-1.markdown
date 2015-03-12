---
layout: post
title: Learning NoSQL, PHP and Linux, Part-1
description: Short notes on basics of Linux (Linux Mint), shell, apt-get package manager, git and Github, PHP composer, Sublime Text and everything you need to start  rapid development.
header: Categories
group: navigation
permalink: /learning-nosql-php-linux/part-1
group: learning-nosql-php-linux
categories:
- programming
tags:
- linux
- ubuntu
- git
- github
comments: true
---

<iframe src="//slides.com/igormoiseev/linux-database/embed" width="700" height="520" scrolling="no" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>


## Configuring Linux

Now we see how to setup the development environment. First download Linux (for ex. Linux Mint [www.linuxmint.com/download.php](http://www.linuxmint.com/download.php)) and install on Pen Drive following this tutorial [www.ubuntu.com/download/desktop/create-a-usb-stick-on-windows](http://www.ubuntu.com/download/desktop/create-a-usb-stick-on-windows). 

You may wish to install it as the second OS on your PC, see the manual [www.everydaylinuxuser.com/2014/07/how-to-install-linux-mint-alongside.html](http://www.everydaylinuxuser.com/2014/07/how-to-install-linux-mint-alongside.html).


When the Linux is up and running, 

![Linux Mint](/public/images/learning-nosql-php-linux-01.png)

the first to do is to upgrade it to the final release


{% highlight bash %}
$ sudo apt-get update; sudo apt-get dselect-upgrade
{% endhighlight %}

and reboot. 

## Statring with shell


What is "the shell" and why bother? The shell is a program that takes your commands from the keyboard and gives them to the operating system to perform. Nowadays, we have graphical user interfaces (GUIs) in addition to command line interfaces (CLIs) such as the shell. To open one simply click "Menu" and type "terminal"

![Terminal in Linux Mint](/public/images/learning-nosql-php-linux-02.png)


So why bother? 95% of servers is running Linux, most of them are headless -- without GUI!

![Linux Server Share in Internet](/public/images/learning-nosql-php-linux-03.svg)

So as we've seen before simple command like this one

{% highlight bash %}
$ sudo apt-get update; sudo apt-get dselect-upgrade
{% endhighlight %}

upgrades the entire operating system, or installs the web server

{% highlight bash %}
$ sudo apt-get install apache2
{% endhighlight %}


## Package managing `apt-get`

APT, the Advanced Packaging Tool, provide rapid, practical, and efficient way to install packages that would manage dependencies automatically and take care of their configuration files while upgrading.

### Commands

Installation commands

{% highlight bash %}
$ sudo apt-get install <package name>
{% endhighlight %}

Maintenance commands

Update sources

{% highlight bash %}
apt-get update
{% endhighlight %}

Upgrade all installed packages

{% highlight bash %}
apt-get upgrade
{% endhighlight %}

Upgrade all installed packages and tell APT to use "smart" conflict resolution system, and it will attempt to upgrade the most important packages as kernel etc.

{% highlight bash %}
apt-get dselect-upgrade
{% endhighlight %}

Remove package

{% highlight bash %}
apt-get remove <package_name>
{% endhighlight %}

Search available package

{% highlight bash %}
apt-cache search <search_term>
{% endhighlight %}


Search for installed package

{% highlight bash %}
dpkg -l *<search_term>*
{% endhighlight %}


## `GIT`

[`GIT`](/tag/git) is a distributed revision control system with an emphasis on speed, data integrity, and support for distributed, non-linear workflows.
Git was initially designed and developed by Linus Torvalds for [Linux](/tag/linux) kernel development in 2005, and has since become the most widely adopted version control system for software development.

{% highlight bash %}
$ sudo apt-get install git-core
{% endhighlight %}

## Github

[GitHub](/tag/github) is a web-based Git repository hosting service, which offers all of the distributed revision control and source code management (SCM) functionality of Git as well as adding its own features.  

### GitHub for Mac And Windows

GitHub offers very handy utilities for Mac and Windows that enables managing repositories via graphical interface. 

 - GitHub for Mac: https://mac.github.com/
 - GitHub for Windows: https://windows.github.com/

 ![GitHub for Mac](/public/images/learning-nosql-php-linux-04.png)


## Editors and IDE

For Web development there is a big choice of editors and IDE-s available. Let's consider some of them

### Sublime Text

[Sublime Text](http://www.sublimetext.com/) is a sophisticated text editor for code, markup and prose. You'll love the slick user interface, extraordinary features and amazing performance.

![Sublime Text](/public/images/learning-nosql-php-linux-05.png)

### NetBeans IDE

[NetBeans](https://netbeans.org/features/php/) provides full IDE functionality and is a typical choice for [PHP](/tag/php) web development.

![NetBeans IDE](/public/images/learning-nosql-php-linux-06.png)


## Exercises 

### Exercise 1
Please install Apache web server and create "Hello world" page.

### Exercise 2
Install GIT. Register un account su GitHub and Install the GIT Gui.

### Exercise 4
Please install MySQL server, MySQL PHPMyAdmin and MySQL Workbench. Create test database.

### Exercise 5
Clone repository https://github.com/ccoenraets/wine-cellar-php and configure Apache and MySQL to run application.

####Hints

 - install apache2 and mysql
 - enable `rewrite` module with `a2enmon rewrite`
 - permit path rewrite 

{% highlight bash %}
$ sudo vim /etc/apache2/sites-enabled/000-default.conf

<VirtualHost *:80>

...

    <Directory /var/www/html>
            Options FollowSymLinks
            AllowOverride All
            Order allow,deny
            Allow from all
    </Directory>

...

</VirtualHost>
{% endhighlight %}

 - clone repository into cellar folder 

{% highlight bash %}
/var/www/html$ sudo git clone https://github.com/ccoenraets/wine-cellar-php.git cellar`
{% endhighlight %}

### Exercise 6 (advanced, requires knowledge of basics of NodeJS e NPM)
Install Ghost Blogging platfowm https://github.com/TryGhost/Ghost and create one post

