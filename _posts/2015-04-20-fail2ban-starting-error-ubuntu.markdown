---
layout: post
title:  "Fail2Ban starting 200/error on Ubuntu 10.04 or older"
description: "How to avoid the Fail2Ban starting 200/error on Ubuntu 10.04 or older which is caused by the iptables chain name length"
date:   2015-04-20 18:05:45
categories:
- software
tags:
- fail2ban
- ubuntu
- linux
comments: true
---

If you get this sudden error in the `fail2ban.log`

{% highlight bash %}
2015-04-20 11:13:17,722 fail2ban.jail   : INFO   Jail 'apache-honeypot' started
2015-04-20 11:13:17,739 fail2ban.actions.action: ERROR  iptables -N fail2ban-apache-honeypot
iptables -A fail2ban-apache-honeypot -j RETURN
iptables -I INPUT -p tcp -m multiport --dports apache-honeypot -j fail2ban-apache-honeypot returned 200
{% endhighlight %}

most likely you have spotted the character length limitation on the chain name. 

I've discovered that the limit is `16` for the chain length, but [Fail2Ban](/tag/fail2ban) prefix it with `fail2ban-` string 
which eats the `9` characters so only `7` remaining. 

To solve this issue you need to rename iptables action to something like `name=HONEY`  

{% highlight bash %}
[apache-honeypot]
enabled  = enable
filter   = apache-honeypot
action   = iptables-allports[name=HONEY, protocol=all]
logpath  = /var/log/asterisk/full
maxretry = 3
bantime  = 600
{% endhighlight %}

Thas it! The issue is observed on [Fail2Ban](/tag/fail2ban) ver. `0.8` or older. 
