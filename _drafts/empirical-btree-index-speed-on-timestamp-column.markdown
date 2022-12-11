---
layout: post
title:  "Empirical BTree index speed on timestamp column"
description: ""
date:   2015-12-23 10:05:45
categories:
- software
tags:
- linux
- postgresql
comments: true
---

https://stackoverflow.com/questions/16476924/how-to-iterate-over-rows-in-a-dataframe-in-pandas


how postgresql btree index degrades with number of records on range queries, column type timestamp


A B-Tree index in PostgreSQL can degrade with the number of records on range queries for timestamp columns. This is because the B-Tree index is not optimized for range queries on timestamp columns, and the index must be traversed in its entirety to find the matching records within the specified range.

As the number of records increases, the index becomes larger and more complex, and the time required to traverse the index and find the matching records also increases. This can lead to performance degradation and slower query times for range queries on timestamp columns.

To improve the performance of range queries on timestamp columns, it is recommended to use a different type of index, such as a GiST or GIN index, which are optimized for range queries. These indexes can provide faster query times and better performance for range queries on timestamp columns, even with a large number of records.


--------------

how postgresql btree index degrades with number of records on range queries, column type timestamp, provide exact formula of time depending on number of records
In PostgreSQL, a B-tree index may degrade with the number of records on range queries, particularly on timestamp columns, as the index must be scanned more extensively to find the matching records. The exact formula for the time it takes to perform a range query on a timestamp column with a B-tree index in PostgreSQL depends on various factors, such as the size of the records, the number of matching records, the data distribution, and the hardware configuration.

However, in general, the time it takes to perform a range query on a timestamp column with a B-tree index in PostgreSQL can be approximated using the following formula:

Copy code
time = constant + records * log(records) / CPU_speed
where constant is a constant value that depends on the hardware configuration and other factors, records is the number of records in the table, log(records) is the logarithm of the number of records, and CPU_speed is the speed of the CPU in Hertz.

This formula shows that the time it takes to perform a range query on a timestamp column with a B-tree index in PostgreSQL increases with the number of records, but at a decreasing rate due to the logarithmic term. As the number of records increases, the time it takes to perform the query increases more slowly, but it still increases and may eventually become unacceptably long.

To avoid this degradation in performance, it is recommended to use a different indexing mechanism, such as a GiST or GIN index, or to partition the table into smaller, more manageable chunks. This can improve the performance of range queries on timestamp columns with large numbers of records in PostgreSQL.


-----------------

Please list all supported operation by TensorRT Model Optimizer and TensorRT Engine and compare them one to one with PyTorch
The following are the supported operations by TensorRT Model Optimizer:

Convolution
Deconvolution
ReLU
Sigmoid
Tanh
Softmax
Batch normalization
Pooling
Fully connected
Padding
The following are the supported operations by TensorRT Engine:

Convolution
Deconvolution
ReLU
Sigmoid
Tanh
Softmax
Batch normalization
Pooling
Fully connected
Padding
Activation
Elementwise
Convolution layer
Deconvolution layer
Compared to PyTorch, TensorRT Model Optimizer and TensorRT Engine support fewer operations. PyTorch supports a wider range of operations, including various types of recurrent neural networks and more advanced activations like leaky ReLU and ELU. TensorRT is optimized for inference and therefore focuses on the most commonly used operations in deep learning models.




------------
list correspondent TensorRT operation and PyTorch one in a bucket list


TensorRT Convolution: PyTorch Conv2d
TensorRT Deconvolution: PyTorch ConvTranspose2d
TensorRT ReLU: PyTorch ReLU
TensorRT Sigmoid: PyTorch Sigmoid
TensorRT Tanh: PyTorch Tanh
TensorRT Softmax: PyTorch Softmax
TensorRT Batch normalization: PyTorch BatchNorm2d
TensorRT Pooling: PyTorch MaxPool2d
TensorRT Fully connected: PyTorch Linear
TensorRT Padding: PyTorch Pad
