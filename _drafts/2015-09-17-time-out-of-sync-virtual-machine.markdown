---
layout: post
title:  "Time out of sync in the virtual machine"
description: "How to sync time in the virtual machine "
date:   2015-09-17 10:05:45
categories:
- software
tags:
- subversion
- git
- gitlab
- linux
- openssh
comments: true
---

please try/check the following:

```
echo 1 > /proc/sys/xen/independent_wallclock
```

To keep the independet wallclock after a reboot set
xen.independent_wallclock = 1
in "/etc/sysctl.conf".

Afterwards you should be able to sync your time via ntp.

https://serverfault.com/questions/39356/why-is-the-time-messed-up-on-my-ubuntu-server-vps

https://access.redhat.com/documentation/en-US/Red_Hat_Enterprise_Linux/6/html/Virtualization_Administration_Guide/sect-Virtualization-Tips_and_tricks-Libvirt_Managed_Timers.html