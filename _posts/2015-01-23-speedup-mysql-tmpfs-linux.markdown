---
layout: post
title:  "Speedup MySQL with tmpfs"
description: "Speeding up of the temporary table creation by putting the temp dir in RAM"
date:   2015-01-23 10:05:45
categories:
- software
tags:
- linux
- ubuntu
- mysql
- mysqltuner
- iwatch
comments: true
---

Today we will deal with temporary tables and files. 

At first lets examine the MySQL whether it actually uses temporary tables writings with [`mysqltuner`](http://mysqltuner.com/)

{% highlight bash %}
:~$ sudo mysqltuner
[!!] Temporary tables created on disk: 28% (324K on disk / 1M total)
{% endhighlight %}

Yes, it is definitely does. Just one thing to know is that

> Temporary tables are not always flushed to disk, since the time to live of temporary table is rather small.   

Lets find where MySQL saves temporary tables 

{% highlight bash %}
sudo cat /etc/mysql/my.cnf | grep tmpdir
tmpdir		= /tmp
{% endhighlight %}

If you had no success with previous one find out with the query  

{% highlight bash %}
mysql> SHOW GLOBAL VARIABLES LIKE 'tmpdir';
+---------------+-------+
| Variable_name | Value |
+---------------+-------+
| tmpdir        | /tmp  |
+---------------+-------+
1 row in set (0.00 sec)
{% endhighlight %}

Let's make sure that MySQL intensively writing in this folder using great [`iwatch`](http://iwatch.sourceforge.net/index.html) command

{% highlight bash %}
:~$ sudo iwatch /tmp/
[23/gen/2015 10:43:08] IN_CREATE /tmp//#sql_a87_0.MYI
[23/gen/2015 10:43:08] IN_CREATE /tmp//#sql_a87_0.MYD
[23/gen/2015 10:43:08] IN_CLOSE_WRITE /tmp//#sql_a87_0.MYD
[23/gen/2015 10:43:08] IN_CLOSE_WRITE /tmp//#sql_a87_0.MYI
[23/gen/2015 10:43:08] IN_CLOSE_WRITE /tmp//#sql_a87_0.MYI
[23/gen/2015 10:43:08] IN_CLOSE_WRITE /tmp//#sql_a87_0.MYD
{% endhighlight %}

This is a good sign, so lets do the rest. 

Add the following string to the `/etc/fstab`

{% highlight bash %}
:~$ sudo cat /etc/fstab
tmpfs   /tmp         tmpfs   nodev,nosuid,size=256M          0  0
{% endhighlight %}

Now let's apply it without reboot

{% highlight bash %}
:~$ sudo mount -a
{% endhighlight %}

Now check how faster is scrolling the listing in `iwatch /tmp`. 
This optimization will be useful also for many other services such as anti-viruses, PHP and web servers, Java and so on. 

