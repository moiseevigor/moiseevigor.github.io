---
layout: post
title:  "SSD - the definitive guide for Linux!"
description: "The definitive guide for solid state drive configuratio in linux; Tips and tricks; Troubleshooting and suggestions of configuration"
date:   2014-11-20 18:05:45
categories:
- hardware
tags:
- ssd
- linux
- unix
comments: true
---

## STEP 1:

Choose a disk with the most optimal ratio IOPS/price. Check out the list of disks in order of IOPS (Input/Output Operations Per Second)  performance: [en.wikipedia.org/wiki/IOPS](https://en.wikipedia.org/wiki/IOPS#Examples).

Quite often SSD disks are released with firmware bugs or with non-optimal configurations, so before putting the system in production checkout the latest version.

## STEP 2:

Check that `AHCI` - [Advanced Host Controller Interface](https://en.wikipedia.org/wiki/Advanced_Host_Controller_Interface) is enabled and working:

```bash
$ sudo dmesg | grep -i ahci
    ahci 0000:00:11.0: version 3.0
    ahci 0000:00:11.0: irq 43 for MSI/MSI-X
    ahci 0000:00:11.0: AHCI 0001.0200 32 slots 6 ports 3 Gbps 0x3f impl SATA mode
    ahci 0000:00:11.0: flags: 64bit ncq sntf ilck pm led clo pmp pio slum part 
    scsi0 : ahci
    scsi1 : ahci
    scsi2 : ahci
```

Check whether your controller supports `AHCI`:

```bash
$ sudo lshw | grep -i ahci
    product: 82801JI (ICH10 Family) SATA AHCI Controller
    capabilities: storage msi pm ahci_1.0 bus_master cap_list emulated
    configuration: driver=ahci latency=0
```

Quite often the `AHCI` is disabled in BIOS, in this case reboot and enable it.

I observed unstable behavior of disks without `AHCI` enabled and even the inability to execute `TRIM` correctly.

Identify the type of SATA modes available (for ex. SATA-II: 3Gbps gives the theoretical limit of speed 375MB/s)

```bash
$ sudo dmesg | grep SATA
    ahci 0000:00:11.0: AHCI 0001.0200 32 slots 6 ports 3 Gbps 0x3f impl SATA mode
    ata1: SATA max UDMA/133 abar m1024@0xfddffc00 port 0xfddffd00 irq 43
```

Check what is supported by disk

```bash
$ sudo hdparm -I /dev/sda | grep SATA
    Transport:          Serial, ATA8-AST, SATA 1.0a, SATA II Extensions, SATA Rev 2.5, SATA Rev 2.6, SATA Rev 3.0
```

The ideal would be any revision higher than `SATA Rev 3.0` which guaranties the 6Gbps or higher speeds.

<br>

## STEP 2.5: Pause

<iframe scrolling="no" frameborder="0" allowTransparency="true" src="https://www.deezer.com/plugins/player?autoplay=false&amp;playlist=true&amp;width=700&amp;height=240&amp;cover=true&amp;type=playlist&amp;id=30595446&amp;title=&amp;app_id=undefined" width="700" height="240"></iframe>


<br>

## STEP 3:

Check that disk `TRIM` ([wikipedia.org/wiki/Trim](https://en.wikipedia.org/wiki/Trim_%28computing%29)) works fine

```bash
$ sudo hdparm -I /dev/sda | grep -i trim
       *    Data Set Management TRIM supported (limit 8 blocks)
```

It is very important to have `TRIM` functioning. Without `TRIM` the disk speed will degrade with time due to the fact that the SSD will have to erase the cell before every write operation.

Let's test it simply by executing `fstrim`

```bash
$ sudo fstrim -v /
/: 98147174400 bytes were trimmed
```

Lets test whether the `TRIM` is really doing what it should

```bash
$ sudo wget -O /tmp/test_trim.sh "https://sites.google.com/site/lightrush/random-1/checkiftrimonext4isenabledandworking/test_trim.sh?attredirects=0&d=1"
$ sudo chmod +x /tmp/test_trim.sh
$ sudo /tmp/test_trim.sh <tempfile> 50 /dev/sdX
```

If `TRIM` is properly working the result of the last command should be a bunch of zeros, thanks to [Nicolay Doytchev](https://sites.google.com/site/lightrush/random-1/checkiftrimonext4isenabledandworking/) for this script.

## STEP 4:

Be sure to format disk in the SSD friendly file system: `EXT4`, `F2FS`, `BTRFS`, `XFS`
or any other from this list [File systems optimized for flash memory](https://en.wikipedia.org/wiki/List_of_file_systems#File_systems_optimized_for_flash_memory.2C_solid_state_media).

If not, you'll better migrate it to `EXT4` at least with the help of this manual
[Migrating a live system from ext3 to ext4 filesystem](https://www.debian-administration.org/article/643/Migrating_a_live_system_from_ext3_to_ext4_filesystem) or consider the complete
re-installation of the operating system.

## STEP 5:

Mount disk with correct parameters

```bash
$ cat /etc/fstab
/dev/pve/data /var/lib/vz ext4 discard,noatime,commit=600,defaults 0 1
```

Check whether the disk is identified as non `rotational`

```bash
$ sudo for f in /sys/block/sd?/queue/rotational; do printf "$f is "; cat $f; done
/sys/block/sda/queue/rotational is 0
```

If you see `1` on SSD, that means there are some problem with kernel or `AHCI`

The next is to check that the  scheduler option is selected on `deadline` for our brand new SSD drive

```bash
$ sudo for f in /sys/block/sd?/queue/scheduler; do printf "$f is "; cat $f; done
/sys/block/sda/queue/scheduler is noop [deadline] cfq
```

If not execute the following

```bash
$ sudo echo deadline > /sys/block/sda/queue/scheduler
```


## References
 - [wiki.debian.org/SSDOptimization](https://wiki.debian.org/SSDOptimization)
 - [zoomingin.net/come-abilitare-funzione-trim-ssd-linux/](https://www.zoomingin.net/come-abilitare-funzione-trim-ssd-linux/)
 - [sites.google.com/site/lightrush/random-1/checkiftrimonext4isenabledandworking](https://sites.google.com/site/lightrush/random-1/checkiftrimonext4isenabledandworking)
 - [superuser.com/questions/417857/how-to-find-sata-controller-version-on-ubuntu-laptop-do-i-have-sata-1-2-or-3](https://superuser.com/questions/417857/how-to-find-sata-controller-version-on-ubuntu-laptop-do-i-have-sata-1-2-or-3)
 - [cyberciti.biz/faq/linux-change-io-scheduler-for-harddisk](https://www.cyberciti.biz/faq/linux-change-io-scheduler-for-harddisk/)