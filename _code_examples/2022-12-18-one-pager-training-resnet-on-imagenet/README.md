## Train Resnet50 on ImageNet with PyTorch

Code for the blog post [Train Resnet50 on ImageNet with PyTorch](https://moiseevigor.github.io/software/2022/12/18/one-pager-training-resnet-on-imagenet/).

## Run locally with Docker 

To be able to use this image you have to 
- Download `kaggle.json` from kaggle.com > Account > API > Create New API Token, more in https://github.com/Kaggle/kaggle-api
- Join competition https://www.kaggle.com/c/imagenet-object-localization-challenge

To build the Docker container, you can run the following command:

```bash
docker build -t resnet50 .
```

This will build the Docker container and tag it with the name "resnet50".

To run the container, you can use the following command:

```bash
docker run --gpus all -it resnet50
```
