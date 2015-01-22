---
layout: post
title:  "Block denial-of-service on Wordpress and Joomla with Fail2Ban in ISPConfig"
description: "Block denial-of-service on Wordpress and Joomla with Fail2Ban in ISPConfig"
date:   2015-01-22 18:05:45
categories:
- software
tags:
- software
- ispconfig
- fail2ban
- wordpress
- joomla
- ddos
- denial-of-service
- attack
- tips
comments: true
---

Are you tired to see these lines in Apache log

{% highlight bash %}
cat /var/log/apache2/other_vhosts_access.log | grep "wp-login.php"

example.com:80 95.211.131.148 - - [20/Jan/2015:12:40:14 +0100] "POST /wp-login.php HTTP/1.0" 200 211 "-" "-"
example.com:80 95.211.131.148 - - [20/Jan/2015:12:40:14 +0100] "POST /wp-login.php HTTP/1.0" 200 211 "-" "-"
example.com:80 95.211.131.148 - - [20/Jan/2015:12:40:14 +0100] "POST /wp-login.php HTTP/1.0" 200 211 "-" "-"
example.com:80 95.211.131.148 - - [20/Jan/2015:12:40:14 +0100] "POST /wp-login.php HTTP/1.0" 200 211 "-" "-"
example.com:80 95.211.131.148 - - [20/Jan/2015:12:40:15 +0100] "POST /wp-login.php HTTP/1.0" 200 211 "-" "-"
example.com:80 95.211.131.148 - - [20/Jan/2015:12:40:15 +0100] "POST /wp-login.php HTTP/1.0" 200 211 "-" "-"
example.com:80 95.211.131.148 - - [20/Jan/2015:12:40:15 +0100] "POST /wp-login.php HTTP/1.0" 200 211 "-" "-"
example.com:80 95.211.131.148 - - [20/Jan/2015:12:40:15 +0100] "POST /wp-login.php HTTP/1.0" 200 211 "-" "-"
example.com:80 95.211.131.148 - - [20/Jan/2015:12:40:15 +0100] "POST /wp-login.php HTTP/1.0" 200 211 "-" "-"
{% endhighlight %}

Actually your server is working hard managing multiple attempts to login, especially in such frameworks like 
Wordpress and Joomla. The saturation of database connections results in Denial-of-Service and the website downtimes!

To block the unsolicited requests and avoid website downtimes we just need to follow some steps   

## STEP 1: Fail2ban installation

Install [`Fail2ban`](http://www.fail2ban.org):

 - On Ubuntu: [How To Install and Use Fail2ban on Ubuntu 14.04](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-fail2ban-on-ubuntu-14-04)
 - On Debian: [How To Protect SSH with fail2ban on Debian 7](https://www.digitalocean.com/community/tutorials/how-to-protect-ssh-with-fail2ban-on-debian-7)
 - On CentOS and Redhat: [How To Protect SSH with fail2ban on CentOS 6](https://www.digitalocean.com/community/tutorials/how-to-protect-ssh-with-fail2ban-on-centos-6)

## STEP 2: Fail2ban jail configuration

Now lets configure `Fail2ban` to ban the attacker.

{% highlight bash %}
sudo vim /etc/fail2ban/jail.conf
{% endhighlight %}

add the following to the end of the file

{% highlight bash %}
[framework-ddos]
enabled = true
port = 80,443
protocol = tcp
filter = framework-ddos
logpath = /var/log/apache2/other_vhosts_access.log
maxretry = 10
# findtime: 10 mins
findtime = 600
# bantime: 1 week
bantime  = 604800
{% endhighlight %}

The default installation of [ISPConfig](http://www.ispconfig.org) writes into log file loceted in `/var/log/apache2/other_vhosts_access.log` in the following format

{% highlight bash %}
example.com:80 95.211.131.148 - - [22/Jan/2015:17:10:52 +0100] "GET /wp-login.php HTTP/1.1" 200 22457 "-" "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
{% endhighlight %}

The next is the most important part, the filter configuration

{% highlight bash %}
vim /etc/fail2ban/filter.d/framework-ddos.conf 
{% endhighlight %}

and put the following regular expressions

{% highlight bash %}
[Definition]

# Wordress
failregex = .*:(80|443) <HOST> .*(GET|POST) /xmlrpc.php
            .*:(80|443) <HOST> .*(GET|POST) /wp-login.php
# Joomla
failregex = .*:(80|443) <HOST> .*(GET|POST) /administrator/index.php
{% endhighlight %}

Restart `Fail2ban` 

{% highlight bash %}
sudo /etc/init.d/fail2ban restart
{% endhighlight %}

## STEP 3: Testing and monitoring

Start monitoring the log file 

{% highlight bash %}
sudo tail -f /var/log/fail2ban.log 
{% endhighlight %}

once you've seen the first attacker

{% highlight bash %}
2015-01-20 12:40:35,205 fail2ban.actions: WARNING [framework-ddos] Ban 95.211.131.148
{% endhighlight %}

Check out the `iptables` for the action applied correct firewall rules

{% highlight bash %}
Chain fail2ban-framework-ddos (1 references)
target     prot opt source               destination         
DROP       all  --  95.211.131.148       0.0.0.0/0           
{% endhighlight %}

This is it!

