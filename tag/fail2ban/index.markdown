---
layout: default
title: Fail2Ban tagged articles
tag: fail2ban
---

<div style="float: left; margin: 2.0rem;">
	<img src="/public/images/{{ page.tag }}.png" style="max-width: 10rem;" alt="{{ page.tag }}" />
</div>

[Fail2Ban](http://www.fail2ban.org) bans hosts that cause multiple authentication errors. 

Fail2Ban scans log files like /var/log/auth.log and bans IP that makes too many password failures. It updates firewall rules to reject the IP address. These rules can be defined by the user. Fail2Ban can read multiple log files such as sshd or [Apache](/tag/apache) web server ones.

{% include tagged_posts_list.html %}

{% include discus.html %}
