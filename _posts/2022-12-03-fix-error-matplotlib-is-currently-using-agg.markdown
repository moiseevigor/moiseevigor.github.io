---
layout: post
title:  "Fixing error 'Matplotlib is currently using agg'"
description: "Plotting graphics with python and matplotlib from Docker container"
date:   2022-12-03 10:05:45
categories:
- software
tags:
- docker
- linux
- unix
comments: true
---

Have you ever built graphs in `matplotlib` or any other GUI running in docker? You will have to overcome some obstacles

1. missing X11 server inside docker
2. missing X11-related libraries to able to render your GUI elements

For example, I'm writing this simple python program

```
import matplotlib.pyplot as plt
import numpy as np

# evenly sampled time at 200ms intervals
t = np.arange(0., 5., 0.2)

# red dashes, blue squares and green triangles
plt.plot(t, t, 'r--', t, t**2, 'bs', t, t**3, 'g^')
plt.show()
```

First allow to connect to X11 server by 

```
xhost local:root
```

And I want to run it in the docker container, by emitting the command

```
docker run -it --rm --env="DISPLAY" -v "/tmp/.X11-unix:/tmp/.X11-unix:rw" -v $PWD:/app python-container python /app/example.py

/app/examples/example.py:9: UserWarning: Matplotlib is currently using agg, which is a non-GUI backend, so cannot show the figure.
  plt.show()
```

To fix the error `Matplotlib is currently using agg`, one dependency must be installed. Below I provide a minimalist `Dockerfile` which includes the most important 
X11 library dependency `libx11-6`, which works fine on Ubuntu 20-22.04 and Debian 11+.

```
FROM python

RUN apt-get update && \
    apt-get install -y \
        python3 \
        python3-setuptools \
        libx11-6 \
        ca-certificates

RUN pip3 install numpy matplotlib

WORKDIR /app
```

et voilà, we have perfectly running minimalist docker container that is able to connect to a local X11 server and create GUI elements!

**Note 1**. To build an image run 

```
docker build -t python-container .
```

**Note 2**. What does `--env="DISPLAY"` stand for? `--env` propagates `$DISPLAY` environment variable into the container.

 **Note 3**. What `-v "/tmp/.X11-unix:/tmp/.X11-unix:rw"` does? It mounts X11 socket into the `/tmp` folder inside the container 
 that will be used by GUI applications to render GUI elements.
