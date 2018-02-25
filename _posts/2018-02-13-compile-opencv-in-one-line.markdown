---
layout: post
title:  "Compile OpenCV 3.3.1 in one line"
description: "Just fast short one line command to compile the OpenCV 3.3.1"
date:   2018-02-13 10:05:45
categories:
- software
tags:
- opencv
- linux
comments: true
---

At first you may need to install the dependency packages

```bash
apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    git \
    ssl-cert \
    ca-certificates\
    yasm \
    pkg-config \
    libswscale-dev \
    libtbb2 \
    libtbb-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libjasper-dev \
    libavformat-dev \
    libpq-dev \
    qtbase5-dev \
    python3.5-dev \
    python3-tk
```

And here is the shorthand command to run in the shell

```bash
git clone https://github.com/opencv/opencv.git; \
cd opencv; git checkout 3.3.1; cd ..; \
git clone https://github.com/opencv/opencv_contrib.git; \
cd opencv_contrib; git checkout 3.3.1; cd ..; \
cd opencv; mkdir build; cd build; \
cmake -D CMAKE_BUILD_TYPE=RELEASE \
  -D CMAKE_INSTALL_PREFIX=/usr/local \
  -D WITH_CUDA=OFF \
  -D WITH_TBB=ON \
  -D WITH_V4L=ON \
  -D WITH_QT=ON \
  -D WITH_OPENGL=ON \
  -D OPENCV_EXTRA_MODULES_PATH=../../opencv_contrib/modules \
  ..; \
make -j8; \
make install; \
sh -c 'echo "/usr/local/lib" >> /etc/ld.so.conf.d/opencv.conf'; \
ldconfig
```

The handy `Dockerfile` with Tensorflow 1.5 + OpenCV 3.3.1 + Python 3 at your disposal [https://gist.github.com/moiseevigor/3e9b00066842c20229be47bd5429f6b1](https://gist.github.com/moiseevigor/3e9b00066842c20229be47bd5429f6b1)
