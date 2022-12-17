---
layout: post
title:  "Surviving guide with Ceph and Proxmox"
description: "Small surviving guide for managing Proxmox cluster with Ceph storage"
date:   2017-03-27 10:05:45
categories:
- software
tags:
- ceph
- proxmox
- linux
comments: true
---

After you've followed the familiar [Proxmox Ceph Server](https://pve.proxmox.com/wiki/Ceph_Server)
manual youl'll have the brand new Ceph clutser up and running, here I'm collecting the basic tasks
and command you'll need to manage Ceph cluster.

## Ceph structure info

### Disk structure

[Ceph](/tag/ceph) automatically configure and creates the block device in `/dev/rbd/<pool-name>/`

```bash
root@node1:~# ls -la /dev/rbd/<pool-name>/
total 0
drwxr-xr-x 2 root root 560 mar 26 15:05 .
drwxr-xr-x 3 root root  60 mar 23 13:29 ..
lrwxrwxrwx 1 root root  11 mar 26 12:39 vm-101-disk-1 -> ../../rbd0
lrwxrwxrwx 1 root root  11 mar 26 13:42 vm-102-disk-1 -> ../../rbd1
lrwxrwxrwx 1 root root  11 mar 23 19:34 vm-103-disk-1 -> ../../rbd2
lrwxrwxrwx 1 root root  11 mar 24 08:31 vm-103-disk-2 -> ../../rbd3
```

It is a normal block device that can be mounted in a regular way

```bash
root@node1:~# fdisk -l /dev/rbd0

Disk /dev/rbd0: 20 GiB, 21474836480 bytes, 41943040 sectors
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 4194304 bytes / 4194304 bytes
Disklabel type: dos
Disk identifier: 0x53332713

Device      Boot    Start      End  Sectors   Size Id Type
/dev/rbd0p1 *          63 41110334 41110272  19,6G 83 Linux
/dev/rbd0p2      41110335 41929649   819315 400,1M  5 Extended
/dev/rbd0p5      41110398 41913584   803187 392,2M 82 Linux swap
```

so

```bash
root@node1:~# mount /dev/rbd0p1 /media
root@node1:~# df -h
Filesystem                          Size  Used Avail Use% Mounted on
/dev/rbd0p1                          20G   17G  1,4G  93% /media
root@node1:~# ls -la /media/
total 2,1G
drwxr-xr-x  24 root root 4,0K mar 23 13:43 .
drwxr-xr-x  22 root root 4,0K mar  9 18:06 ..
drwxr-xr-x   2 root root 4,0K apr 10  2012 bin
drwxr-xr-x   3 root root 4,0K ago  8  2012 boot
lrwxrwxrwx   1 root root   11 apr  9  2010 cdrom -> media/cdrom
drwxr-xr-x   2 root root 4,0K set  3  2012 dev
drwxr-xr-x 109 root root  12K mar 23 13:43 etc
drwxr-xr-x  11 root root 4,0K mag 21  2013 home
drwxr-xr-x   2 root root 4,0K ott 26  2009 initrd
...
```

### Config files structure


## Benchmarking

### BLOCK WRITE 4KB

```bash
root@node1:~# /usr/bin/rados -p rbd bench -b 4096 300 write -t 32 \
  --no-cleanup -m 10.0.4.1:6789 -n client.admin --keyring \
  /etc/pve/priv/ceph.client.admin.keyring --auth_supported cephx df

Total time run:         300.015640
Total writes made:      614977
Write size:             4096
Object size:            4096
Bandwidth (MB/sec):     8.0071
Stddev Bandwidth:       3.35268
Max bandwidth (MB/sec): 11.9766
Min bandwidth (MB/sec): 0.03125
Average IOPS:           2049
Stddev IOPS:            858
Max IOPS:               3066
Min IOPS:               8
Average Latency(s):     0.0156087
Stddev Latency(s):      0.0442384
Max latency(s):         1.51347
Min latency(s):         0.00396259
```

<!--
 ## Disk speeds monitoring
-->
