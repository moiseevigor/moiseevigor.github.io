---
layout: post
title:  "Get file creation time on Linux with EXT4"
description: "How to extract the file created/creation time on Linux with EXT4 filesystem"
date:   2015-01-30 18:05:45
categories:
- software
tags:
- ubuntu
- linux
- unix
- ext4
comments: true
---

Despite the common opinion [unix.stackexchange.com/get-file-created-creation-time](http://unix.stackexchange.com/a/24442/13721)

> Linux offers three timestamps for files: time of last access of contents (atime), time of last modification of contents (mtime), and time of last modification of the inode (metadata, ctime).

You may recover the file creation date if you deal with capble filesystem like [EXT4 - journaling file system for Linux](http://en.wikipedia.org/wiki/Ext4):

> **Improved timestamps**

> ... Ext4 provides timestamps measured in nanoseconds. In addition, ext4 also adds support for date-created timestamps.

But there no consensus in the community on that so

> ... as [Theodore Ts'o points out](https://www.redhat.com/archives/ext3-users/2006-October/msg00015.html), while it is easy to add an extra creation-date field in the inode (thus technically enabling support for date-created timestamps in ext4), it is more difficult to modify or add the necessary system calls, like stat() (which would probably require a new version) and the various libraries that depend on them (like glibc). These changes would require coordination of many projects. So even if ext4 developers implement initial support for creation-date timestamps, this feature will not be available to user programs for now.

Which end up with [the Linus final quote](https://lkml.org/lkml/2010/7/22/249)

> Let's wait five years and see if there is actually any consensus on it being needed and used at all, rather than rush into something just because "we can".

So how would you extract this information? We end up with the `STAT`

{% highlight bash %}
NAME
      stat - display file or file system status

SYNOPSIS
       stat [OPTION]... FILE...

DESCRIPTION
       Display file or file system status.
{% endhighlight %}

and `DEBUGFS` utilities

{% highlight bash %}
NAME
       debugfs - ext2/ext3/ext4 file system debugger

SYNOPSIS
       debugfs [ -Vwci ] [ -b blocksize ] [ -s superblock ] [ -f cmd_file ] [ -R request ] [ -d data_source_device ] [ device ]

DESCRIPTION
       The debugfs program is an interactive file system debugger. It can be used to examine and change the state of an ext2, ext3, or ext4 file system.
       device is the special file corresponding to the device containing the file system (e.g /dev/hdXX).
{% endhighlight %}

So we compound both command in one

{% highlight bash %}
$ debugfs -R 'stat <filename>' </dev/sdXX - partition name>
{% endhighlight %}

to finally get the `crtime` - creation time:

{% highlight bash %}
Inode: 1071162   Type: regular    Mode:  0644   Flags: 0x80000
Generation: 1324300925    Version: 0x00000000:00000001
User:   105   Group:   114   Size: 1831803
File ACL: 0    Directory ACL: 0
Links: 1   Blockcount: 3592
Fragment:  Address: 0    Number: 0    Size: 0
 ctime: 0x54cba040:2718d1c8 -- Fri Jan 30 16:16:16 2015
 atime: 0x54cba167:94c3cfa0 -- Fri Jan 30 16:21:11 2015
 mtime: 0x54cba040:2718d1c8 -- Fri Jan 30 16:16:16 2015
 crtime: 0x54ca6763:94c3c518 -- Thu Jan 29 18:01:23 2015
Size of extra inode fields: 28
EXTENTS:
(0): 4229445, (1-7): 4261097-4261103, ...
{% endhighlight %}

So lets write the [`xstat` utility](https://gist.github.com/moiseevigor/8c496f632137605b322e) before the consensus will come down :)

<script src="https://gist.github.com/moiseevigor/8c496f632137605b322e.js"></script>

and voilà

{% highlight bash %}
$ xstat README.md LICENSE.md search/
README.md	Fri Nov 21 16:31:30 2014
LICENSE.md	Fri Nov 21 16:31:30 2014
search/	Thu Nov 27 19:12:39 2014
{% endhighlight %}

