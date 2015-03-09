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

So as we've seen before simple commands like 

{% highlight bash %}
$ sudo apt-get update; sudo apt-get dselect-upgrade
{% endhighlight %}

upgrades operating system, or install web server

{% highlight bash %}
$ sudo apt-get install apache2
{% endhighlight %}


## Package managing `apt-get`
