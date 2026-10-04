---
layout: post
title:  "Manage wisely your cache setting in Ceph"
description: "Notes on cache settings in Ceph and how to avoid the pitfalls"
date:   2014-11-24 15:05:45
categories:
- virtualization
tags:
- ceph
- linux
- ubuntu
comments: true
---

Today we discuss how to wisely manage your cache settings in Ceph ([docs.ceph.com/en/latest/rbd/index.html](https://docs.ceph.com/en/latest/rbd/index.html)). The type of cache discussed below is the user space implementation of the Ceph block device (i.e., `librbd`).

Suddenly after migration to Ceph we started observing the doubling of memory usage by every virtual machine.


![Ceph memory consumption is doubling](/public/images/manage-wisely-cache-setting-ceph-1.png)

After some research we found a configuration error in `ceph.conf`. The option `rbd cache size` describes the amount of cache reserved for **every virtual disk**, so the total amount of RAM reserved for cache is given by


```bash
total amount of ram = (number of virtual disks)  X  (rbd cache size)
```

After some rational reasoning of the kind - the standard hard drive usually possesses `64M` of cache - the final version of the configuration will be the following

```bash
rbd cache = true
rbd cache size = 67108864 # (64MB)
rbd cache max dirty = 50331648 # (48MB)
rbd cache target dirty = 33554432 # (32MB)
rbd cache max dirty age = 2
rbd cache writethrough until flush = true
```


Now push the configuration to the virtual hosts

```bash
$ ceph-deploy --overwrite-conf config push host1 host2
```

To apply settings without virtual machine restart use `KVM` live migration. After the virtual machine is migrated from `host1` to `host2` the new process will start taking into account the modification to the ceph configuration.

If not sure about the settings, leave Ceph's default values for the amount of cache and simply enable it

```bash
rbd cache = true
rbd cache writethrough until flush = true
```


