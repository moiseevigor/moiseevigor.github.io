---
layout: post
title:  "Compile OpenCV in one line"
description: "Just fast short one line command to compile the OpenCV 3.3.1"
date:   2018-02-13 10:05:45
categories:
- software
tags:
- opencv
- linux
comments: true
---


Here is the shothand command to run in the shell

```
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
