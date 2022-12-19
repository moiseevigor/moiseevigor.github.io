---
layout: post
title:  "How to Train a Resnet50 on ImageNet"
description: "One pager version of training code for ResNet50 on ImageNet dataset"
date:   2022-12-18 10:05:45
categories:
- software
tags:
- machinelearning
- deeplearning
comments: true
---

Without further due, here is a one pager code for training Resnet50 on ImageNet in PyTorch:

```python
import torch
import torchvision
import torchvision.transforms as transforms

# Set device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load the dataset
dataset = torchvision.datasets.ImageNet(root='./data', 
                                        split='train', 
                                        transform=transforms.ToTensor())

# Create dataloader
dataloader = torch.utils.data.DataLoader(dataset, 
                                         batch_size=64, 
                                         shuffle=True, 
                                         num_workers=4)

# Load the model
model = torchvision.models.Resnet50(pretrained=True)

# Move model to the device
model.to(device)

# Set the loss function and optimizer
criterion = torch.nn.CrossEntropyLoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.001, momentum=0.9)

# Train the model
for epoch in range(10):
    running_loss = 0.0
    for i, data in enumerate(dataloader, 0):
        # Get the inputs and labels
        inputs, labels = data[0].to(device), data[1].to(device)

        # Zero the parameter gradients
        optimizer.zero_grad()

        # Forward pass
        outputs = model(inputs)
        loss = criterion(outputs, labels)

        # Backward pass and optimize
        loss.backward()
        optimizer.step()

        # Print statistics
        running_loss += loss.item()
        if i % 2000 == 1999:
            # print every 2000 mini-batches
            print('[%d, %5d] loss: %.3f' %
                  (epoch + 1, i + 1, running_loss / 2000))
            running_loss = 0.0

print('Finished Training')
```

This code will train the Resnet50 model on the ImageNet dataset for 10 epochs using the SGD optimizer with a learning rate of `0.001` and momentum of `0.9`. The model is trained on the GPU if available, otherwise it is trained on the CPU. The code prints the running loss every `2000` mini-batches.

Note that you will need to download the ImageNet dataset and set the root parameter in the `torchvision.datasets.ImageNet` function to the directory where the dataset is stored. You may also need to adjust the batch size and number of workers to match your system's configuration.

## Extended explanation of each training step

### Import the necessary PyTorch modules:

```python
import torch
import torchvision
import torchvision.transforms as transforms
```

`torch` is the core PyTorch module that provides tensors and basic mathematical operations. torchvision is a PyTorch package that provides utilities for loading and preprocessing image data. `transforms` is a submodule of `torchvision` that provides functions for performing image preprocessing.

### Set the device to use for training:

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
```

This line sets the device variable to "cuda" if a GPU is available, otherwise it sets it to "cpu". The model and tensors will be moved to this device later in the code.

### Load the ImageNet dataset:

```python
dataset = torchvision.datasets.ImageNet(root='./data', 
                                        split='train', 
                                        transform=transforms.ToTensor())
```
This line uses the `torchvision.datasets.ImageNet` function to load the ImageNet dataset. The root parameter specifies the directory where the dataset is stored, the split parameter specifies which split of the dataset to use (in this case, the training split), and the transform parameter specifies a transformation to apply to the images. The `transforms.ToTensor` transformation converts the images from `PIL` image objects to PyTorch tensors.

### Create a dataloader for the dataset:
```python
dataloader = torch.utils.data.DataLoader(dataset, 
                                         batch_size=64, 
                                         shuffle=True, 
                                         num_workers=4)
```
The `torch.utils.data.DataLoader` function creates a dataloader for the dataset. The `batch_size` parameter specifies the number of samples per batch, the `shuffle` parameter specifies whether to shuffle the data at each epoch, and the `num_workers` parameter specifies the number of worker threads to use for loading the data

> A rule of thumb for the number of workers is the number of CPU cores minus 1 for controlling processes `os.cpu_count()` or `multiprocessing.cpu_count()` can help with this.

### Load the Resnet50 model:
```python
model = torchvision.models.-(pretrained=True)
```

This line uses the `torchvision.models.-` function to load the Resnet50 model, with the pretrained parameter set to `True` to use the pretrained weights.


### Move the model to the device:

```python
model.to(device)
```

This line moves the model and its parameters to the device specified earlier.

### Set the loss function and optimizer:
```python
criterion = torch.nn.CrossEntropyLoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.001, momentum=0.9)
```

The `torch.nn.CrossEntropyLoss` function creates a cross entropy loss criterion, which is commonly used for classification tasks. The `torch.optim.SGD` function creates an SGD optimizer with the specified learning rate and momentum. The `model.parameters()` method returns a list of the model's trainable parameters, which the optimizer will adjust during training.

### Train the model:

```python
for epoch in range(10):
    running_loss = 0.0
    for i, data in enumerate(dataloader, 0):
        # Get the inputs and labels
        inputs, labels = data[0].to(device), data[1].to(device)

        # Zero the parameter gradients
        optimizer.zero_grad()

        # Forward pass
        outputs = model(inputs)
        loss = criterion(outputs, labels)

        # Backward pass and optimize
        loss.backward()
        optimizer.step()

        # Print statistics
        running_loss += loss.item()
        if i % 2000 == 1999:    # print every 2000 mini-batches
            print('[%d, %5d] loss: %.3f' %
                  (epoch + 1, i + 1, running_loss / 2000))
            running_loss = 0.0
```

This block of code trains the model for 10 epochs. An epoch is a complete pass through the training data.

In each epoch, the code iterates over the dataloader, which yields batches of inputs and labels. The inputs and labels are moved to the device, and the gradients are zeroed using the `optimizer.zero_grad()` method. 

> During the training process, the gradients of the model's parameters are computed using backpropagation, which involves propagating the loss gradient back through the model's layers to compute the gradients of the model's parameters. These gradients are used to update the model's parameters using the optimizer's update rule. <br/><br/>
> However, if you don't zero the gradients before each training step, the gradients will accumulate and the update rule will be based on the sum of the gradients over all previous training steps. This can cause the model's parameters to oscillate or diverge, leading to poor convergence and potentially poor model performance. <br/><br/>
> By calling optimizer.zero_grad() before each training step, you reset the gradients of the model's parameters to zero, ensuring that the update rule is based only on the gradients of the current training step.

Next, the model performs a forward pass on the inputs, producing output logits. The loss is then computed using the output logits and the labels, and the model's gradients are computed using the `loss.backward()` method. Finally, the optimizer takes a step to update the model's parameters using the gradients.

The running loss is accumulated over each mini-batch and is printed every 2000 mini-batches. At the end of each epoch, the running loss is reset to 0.

## Training environment with Docker

```dockerfile
FROM pytorch/pytorch

# Install additional dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip

# Download the ImageNet dataset
RUN mkdir -p /app/data && \
    wget -P /app/data/ http://image-net.org/imagenet_data/urls/imagenet_fall11_urls.tgz && \
    tar xzf /app/data/imagenet_fall11_urls.tgz -C /app/data && \
    wget -P /app/data/ http://image-net.org/imagenet_data/original_images/fall11_original.tar && \
    tar xf /app/data/fall11_original.tar -C /app/data && \
    rm /app/data/imagenet_fall11_urls.tgz && \
    rm /app/data/fall11_original.tar

# Copy the code
COPY resnet50.py /app/

# Set the working directory
WORKDIR /app

# Run the code
CMD ["python", "resnet50.py"]
```

This `Dockerfile` is based on the `pytorch/pytorch` image with CUDA 10.1 and cuDNN 8, which provides the necessary dependencies for running PyTorch programs with GPU acceleration.

The `Dockerfile` installs the `wget` and `unzip` utilities, which are needed to download the ImageNet dataset. It then downloads the dataset and extracts the images to the `/app/data` directory.

Next, the Dockerfile copies the `resnet50.py` file, which should contain the code for training the ResNet50 model, to the `/app` directory. It then sets the working directory to /app and specifies that the python `resnet50.py` command should be run when the container is started.

To build the Docker container, you can run the following command:

```bash
docker build -t resnet50 .
```

This will build the Docker container and tag it with the name "resnet50".

To run the container, you can use the following command:

```bash
docker run --gpus all -v /app/data:/app/data -it resnet50
```

This will run the container with access to all available GPUs, mount the `/app/data` directory from the host machine to the `/app/data` directory in the container, and start the container in interactive mode.

This will start the training of the ResNet50 model on the ImageNet dataset. You should see the running loss printed to the console as the training progresses.

> Unfortunately image-net.org does not serve publicly imagenet data, so files download `imagenet_fall11_urls.tgz` and `fall11_original.tar` will fail, you may search in internet to find a replacement, like [Kaggle](https://www.kaggle.com/competitions/imagenet-object-localization-challenge/data), but I cannot guarantee it. Or you can look into [ImageNetX project](https://facebookresearch.github.io/imagenetx/site/home) by Facebook research.

I hope this helps! Let me know if you have any questions.

<div>
  <img id="ads_logo" alt="ads" src="/public/images/ads.png" style="max-width: 20px;" />
  <div class="image-grid">
    {% include page_tags_list_books.html %}
  </div>
</div>
