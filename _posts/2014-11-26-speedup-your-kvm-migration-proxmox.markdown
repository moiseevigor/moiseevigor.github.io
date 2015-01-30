---
layout: post
title:  "Speedup your KVM migration in Proxmox"
description: "Notes on cache setting in Ceph and how to avoid the pitfalls"
date:   2014-11-26 17:05:45
categories:
- virtualization
tags:
- kvm
- proxmox
- linux
comments: true
---

If you ever woundered why your 10Gbit link on [Proxmox](https://www.proxmox.com/) node is used only by a few percent during the migration, so you came to the right place.

The main reason is the **security measures** taken to protect virtual machine memory during the migration. All volume of memory will be transmitted via secure tunnel and that penalizes the speed:


{% highlight bash %}
Nov 24 12:26:41 starting migration of VM 123 to node 'proxmox1' (10.0.1.1)
Nov 24 12:26:41 copying disk images
Nov 24 12:26:41 starting VM 123 on remote node 'proxmox1'
Nov 24 12:26:43 starting ssh migration tunnel
Nov 24 12:26:43 starting online/live migration on localhost:60000
Nov 24 12:26:43 migrate_set_speed: 8589934592
Nov 24 12:26:43 migrate_set_downtime: 0.1
Nov 24 12:26:45 migration status: active (transferred 133567908, remaining 930062336), total 1082789888)
Nov 24 12:26:47 migration status: active (transferred 273781779, remaining 788221952), total 1082789888)

...

Nov 24 12:26:58 migration status: active (transferred 1036346176, remaining 20889600), total 1082789888)
Nov 24 12:26:58 migration status: active (transferred 1059940218, remaining 11558912), total 1082789888)
Nov 24 12:26:59 migration speed: 64.00 MB/s - downtime 54 ms
Nov 24 12:26:59 migration status: completed
Nov 24 12:27:02 migration finished successfuly (duration 00:00:21)
TASK OK
{% endhighlight %}


If your configured your Proxmox cluster to use the dedicated network isolated from the public one so you may low down the security level

{% highlight bash %}
$ cat /etc/pve/datacenter.cfg
  ....
  migration_unsecure: 1
{% endhighlight %}

This is it:

{% highlight bash %}
Nov 24 12:42:19 starting migration of VM 100 to node 'proxmox2' (10.0.1.2)
Nov 24 12:42:19 copying disk images
Nov 24 12:42:19 starting VM 100 on remote node 'proxmox2'
Nov 24 12:42:35 starting ssh migration tunnel
Nov 24 12:42:36 starting online/live migration on 10.0.1.2:60000
Nov 24 12:42:36 migrate_set_speed: 8589934592
Nov 24 12:42:36 migrate_set_downtime: 0.1
Nov 24 12:42:38 migration status: active (transferred 728684636, remaining 5655494656), total 6451433472)
Nov 24 12:42:40 migration status: active (transferred 1465523175, remaining 4865253376), total 6451433472)

....

Nov 24 12:42:55 migration status: active (transferred 7115710846, remaining 69742592), total 6451433472)
Nov 24 12:42:55 migration speed: 323.37 MB/s - downtime 262 ms
Nov 24 12:42:55 migration status: completed
Nov 24 12:42:58 migration finished successfuly (duration 00:00:39)
TASK OK
{% endhighlight %}

now you're using all available bandwidth for migration, that also is very useful during migration heavy loaded instances.



