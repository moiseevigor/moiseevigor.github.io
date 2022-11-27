---
layout: post
title:  "Cleaning up Docker space"
description: ""
date:   2022-11-27 10:05:45
categories:
- software
tags:
- docker
- linux
comments: true
---

Reguarly cleaning your dangling contianers and images. 

**Step 1**: cleaning containers, don't worry it destroyes only stopped containers

```
docker ps -aq| xargs docker rm
```

**Step 2**: removing dangling images 

```
docker rmi $(docker images -q --filter "dangling=true")
```


Docker itself offers a number of tools to prune and clean up space 

1. Inspecting docker filesystem: `docker system df` 
2. Pruning stopped comtainers: `docker container prune` 
3. Removing all local volumes: `docker volume prune` 
4. `docker system prune` will remove   
    - all stopped containers
    - all networks not used by at least one container
    - all dangling images
    - all dangling build cache


