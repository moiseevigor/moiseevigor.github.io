---
layout: post
title:  "SSD - the definitive guide for Linux!"
description: "The definitive guide for solid state drive configuratio in linux; Tips and tricks; Troubleshooting and suggestions of configuration"
date:   2014-11-20 18:05:45
categories: hardware
keywords: hardware,ssd,solid-state-drive,linux,configuration,guide
comments: true
---
ssh -fNg -L 5555:localhost:5432

http://www.ur-ban.com/blog/2010/10/25/ssh-tunnels-with-postgres-pgadmin/
http://dustindavis.me/ssh-tunnel-in-pgadmin3-for-postgresql.html

https://bugs.launchpad.net/ubuntu/+source/mysql-workbench/+bug/1385147

```
Host mysql.tunnel
  HostName some-ssh-server.com
  User ssh_username
  IdentityFile ~/.ssh/config/id_rsa
  LocalForward 3307 127.0.0.1:3306
```