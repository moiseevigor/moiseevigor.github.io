## Train Resnet50 on CIFAR-10 with PyTorch

Code for the blog post [Train Resnet50 on CIFAR-10 with PyTorch]().

## Run locally with Docker 

To be able to use this image you have to 
- Download `kaggle.json` from kaggle.com > Account > API > Create New API Token, more in https://github.com/Kaggle/kaggle-api
- Join competition 

To build the Docker container, you can run the following command:

```bash
docker build -t resnet50-cifar10 .
```

This will build the Docker container and tag it with the name "resnet50-cifar10".

To run the container, you can use the following command:

```bash
docker run --gpus all -it resnet50-cifar10
```

## Run with source code mounted in the container

```bash
docker run --gpus all --ipc=host -it -v $PWD:/app resnet50-cifar10 python /app/resnet50-cifar10.py
```

