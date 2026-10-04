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

First let's examine whether MySQL actually writes temporary tables to disk, with [`mysqltuner`](https://mysqltuner.com/)

```bash
:~$ sudo mysqltuner
[!!] Temporary tables created on disk: 28% (324K on disk / 1M total)
```

Yes, it definitely does. Just one thing to know is that

> Temporary tables are not always flushed to disk, since the time to live of a temporary table is rather short.   

Let's find where MySQL saves temporary tables 

```bash
sudo cat /etc/mysql/my.cnf | grep tmpdir
tmpdir		= /tmp
```

If you had no success with the previous one, find out with the query  

```bash
mysql> SHOW GLOBAL VARIABLES LIKE 'tmpdir';
+---------------+-------+
| Variable_name | Value |
+---------------+-------+
| tmpdir        | /tmp  |
+---------------+-------+
1 row in set (0.00 sec)
```

Let's make sure that MySQL is intensively writing to this folder using the great [`iwatch`](https://iwatch.sourceforge.net/index.html) command

```bash
:~$ sudo iwatch /tmp/
[23/gen/2015 10:43:08] IN_CREATE /tmp//#sql_a87_0.MYI
[23/gen/2015 10:43:08] IN_CREATE /tmp//#sql_a87_0.MYD
[23/gen/2015 10:43:08] IN_CLOSE_WRITE /tmp//#sql_a87_0.MYD
[23/gen/2015 10:43:08] IN_CLOSE_WRITE /tmp//#sql_a87_0.MYI
[23/gen/2015 10:43:08] IN_CLOSE_WRITE /tmp//#sql_a87_0.MYI
[23/gen/2015 10:43:08] IN_CLOSE_WRITE /tmp//#sql_a87_0.MYD
```

This is a good sign, so let's do the rest. 

Add the following string to the `/etc/fstab`

```bash
:~$ sudo cat /etc/fstab
tmpfs   /tmp         tmpfs   nodev,nosuid,size=256M          0  0
```

Now let's apply it without reboot

```bash
:~$ sudo mount -a
```

Now check how much faster the listing scrolls in `iwatch /tmp`. 
This optimization will be useful also for many other services such as anti-viruses, PHP and web servers, Java and so on. 


