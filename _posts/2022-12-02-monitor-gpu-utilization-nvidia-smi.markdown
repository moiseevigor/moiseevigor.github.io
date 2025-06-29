---
layout: post
title:  "Monitor GPU utilization with nvidia-smi"
description: ""
date:   2022-11-27 10:05:45
categories:
- software
tags:
- datascience
- docker
- linux
comments: true
---

When training you'd love to know how efficiently GPU is utilized. Nvidia provides 
a tool `nvidia-smi` with a driver.

Just invoking it without any parameters it gives you a matrix with basic GPU parameters

```
$ nvidia-smi
Fri Dec  2 23:13:41 2022       
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 515.65.01    Driver Version: 515.65.01    CUDA Version: 11.7     |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|                               |                      |               MIG M. |
|===============================+======================+======================|
|   0  NVIDIA GeForce ...  Off  | 00000000:01:00.0  On |                  N/A |
| 20%   50C    P5    25W / 250W |    744MiB / 11264MiB |      0%      Default |
|                               |                      |                  N/A |
+-------------------------------+----------------------+----------------------+
                                                                               
+-----------------------------------------------------------------------------+
| Processes:                                                                  |
|  GPU   GI   CI        PID   Type   Process name                  GPU Memory |
|        ID   ID                                                   Usage      |
|=============================================================================|
|    0   N/A  N/A      4804      G   /usr/lib/xorg/Xorg                292MiB |
|    0   N/A  N/A      4918      G   /usr/bin/gnome-shell              108MiB |
|    0   N/A  N/A     10549      G   ...390539104842029425,131072      340MiB |
+-----------------------------------------------------------------------------+
```

but how to monitor continuously the GPU usage, we have to use keys 

```
$ nvidia-smi dmon -s pucvmet
# gpu   pwr gtemp mtemp    sm   mem   enc   dec  mclk  pclk pviol tviol    fb  bar1 sbecc dbecc   pci rxpci txpci
# Idx     W     C     C     %     %     %     %   MHz   MHz     %  bool    MB    MB  errs  errs  errs  MB/s  MB/s
    0    24    46     -     2     4     0     0   810  1151     0     0   791     6     -     -     0    14     0
    0    19    46     -     0     3     0     0   810  1151     0     0   791     6     -     -     0     0     2
    0    20    45     -     0     3     0     0   810  1151     0     0   791     6     -     -     0     0     2
    0    21    46     -     1     3     0     0   810  1151     0     0   791     6     -     -     0     0     2
    0    19    45     -     9    10     0     0   810  1151     0     0   821     6     -     -     0     0     0
```

the parameters to watch

* p - Power Usage (in Watts) and Gpu/Memory Temperature (in C) if supported
* **u - Utilization (SM, Memory, Encoder and Decoder Utilization in %)**
* c - Proc and Mem Clocks (in MHz)
* v - Power Violations (in %) and Thermal Violations (as a boolean flag) 
* m - Frame Buffer and Bar1 memory usage (in MB)
* e - ECC (Number of aggregated single bit, double bit ecc errors) and PCIe Replay errors
* **t - PCIe Rx and Tx Throughput in MB/s (Maxwell and above)**


