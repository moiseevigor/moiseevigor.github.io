---
layout: post
title:  "Manage wisely your cache setting in Ceph"
description: "Notes on cache setting in Ceph and how to avoid the pitfalls"
date:   2014-11-24 15:05:45
categories:
- virtualization
tags:
- ceph
- linux
- ubuntu
comments: true
---

Today we discuss how to manage wisely your cache setting in Ceph ([ceph.com/docs/master/rbd/rbd-config-ref/](http://ceph.com/docs/master/rbd/rbd-config-ref/)). The type of cache discussed below is the user space implementation of the Ceph block device (i.e., `librbd`).

Suddenly after migration to Ceph we start observing the doubling of memory usage by every virtual machine.


![Ceph memory consumption is doubling](/public/images/manage-wisely-cache-setting-ceph-1.png)

After some research we found the configuration error in `ceph.conf`. The option `rbd cache size` describes the amount of cache reserved for **every virtual disk**, so the total amount of RAM reserved for cache is given by


{% highlight bash %}
total amount of ram = (number of virtual disks)  X  (rbd cache size)
{% endhighlight %}

After some rational reasoning of the kind - the standard hard drive usually possess `64M` of cache - the final version of configuration will be the following

{% highlight bash %}
rbd cache = true
rbd cache size = 67108864 # (64MB)
rbd cache max dirty = 50331648 # (48MB)
rbd cache target dirty = 33554432 # (32MB)
rbd cache max dirty age = 2
rbd cache writethrough until flush = true
{% endhighlight %}


Now push the configuration to the virtual hosts

{% highlight bash %}
$ ceph-deploy --overwrite-conf config push host1 host2
{% endhighlight %}

To apply settings without virtual machine restart use `KVM` live migration. After the virtual machine is migrated from `host1` to `host2` the new process will start taking into account the modification to the ceph configuration.

If not sure about setting leave Ceph's default values for amount of cache, simply enable it

{% highlight bash %}
rbd cache = true
rbd cache writethrough until flush = true
{% endhighlight %}
