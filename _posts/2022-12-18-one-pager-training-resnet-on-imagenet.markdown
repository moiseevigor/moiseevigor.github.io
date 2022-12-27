---
layout: post
title:  "Train Resnet50 on ImageNet with PyTorch"
description: "One pager version of training code in PyTorch for ResNet50 on ImageNet dataset"
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

# Set hyperparameters
num_epochs = 10
batch_size = 64
learning_rate = 0.001

# Initialize transformations for data augmentation
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.RandomRotation(degrees=45),
    transforms.ColorJitter(brightness=0.5, contrast=0.5, saturation=0.5, hue=0.5),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# Load the ImageNet Object Localization Challenge dataset
train_dataset = torchvision.datasets.ImageFolder(
    root='/kaggle/input/imagenet-object-localization-challenge/ILSVRC/Data/CLS-LOC/train', 
    transform=transform
)

train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2)

# Load the ResNet50 model
model = torchvision.models.resnet50(pretrained=True)

# Parallelize training across multiple GPUs
model = torch.nn.DataParallel(model)

# Set the model to run on the device
model = model.to(device)

# Define the loss function and optimizer
criterion = torch.nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)

# Train the model...
for epoch in range(num_epochs):
    for inputs, labels in train_loader:
        # Move input and label tensors to the device
        inputs = inputs.to(device)
        labels = labels.to(device)

        # Zero out the optimizer
        optimizer.zero_grad()

        # Forward pass
        outputs = model(inputs)
        loss = criterion(outputs, labels)

        # Backward pass
        loss.backward()
        optimizer.step()

    # Print the loss for every epoch
    print(f'Epoch {epoch+1}/{num_epochs}, Loss: {loss.item():.4f}')

print(f'Finished Training, Loss: {loss.item():.4f}')
```

This code will train Resnet50 model on the ImageNet dataset for 10 epochs using ADAM optimizer with a learning rate of `0.001`. The model is trained on GPU if available, otherwise it is trained on CPU.

Note that the code is adjusted to run with [ImageNet Object Localization Challenge on Kaggle](https://www.kaggle.com/competitions/imagenet-object-localization-challenge/overview). You may check some results in the notebook [Train Resnet50 on Imagenet with PyTorch](https://www.kaggle.com/code/moiseevigor/train-resnet50-on-imagenet-with-pytorch).

## Expanded explanation of each training step

### Import the necessary PyTorch modules:

```python
import torch
import torchvision
import torchvision.transforms as transforms
```

- `torch` provides tensors and basic mathematical operations
- `torchvision` provides utilities for loading and preprocessing image data
- `torchvision.transforms` is a submodule of `torchvision` that provides functions for performing image preprocessing

### Set the device to use for training:

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
```

This line sets the device variable to "cuda" if a GPU is available, otherwise it sets it to "cpu". The model and tensors will be moved to this device later in the code.

### Prepare transformations for data augmentation

```python
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.RandomRotation(degrees=45),
    transforms.ColorJitter(brightness=0.5, contrast=0.5, saturation=0.5, hue=0.5),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])
```

This block of code makes up the set of transformations that will be applied during training. In particular, the `transforms.Normalize` takes two arguments:

- `[0.485, 0.456, 0.406]` - the mean of the data along each channel (i.e., the red, green, and blue channels for an image).
- `[0.229, 0.224, 0.225]` - the standard deviation of the data along each channel.

These exact values are used for normalizing data that has been pre-trained on the ImageNet dataset. They are based on the statistics of the ImageNet dataset, which consists of a large number of natural images.

### Load the ImageNet dataset:

```python
train_dataset = torchvision.datasets.ImageFolder(
    root='/kaggle/input/imagenet-object-localization-challenge/ILSVRC/Data/CLS-LOC/train', 
    transform=transform
)
```
This line loads ImageNet dataset in Kaggle's format and applies all transformations defined above.

### Create a dataloader for the dataset:
```python
train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2)
```
The `torch.utils.data.DataLoader` function creates a dataloader for the dataset. The `batch_size` parameter specifies the number of samples per batch, the `shuffle` parameter specifies whether to shuffle the data at each epoch, and the `num_workers` parameter specifies the number of worker threads to use for loading the data

> A rule of thumb for the number of workers is the number of CPU cores minus 1 for controlling processes `os.cpu_count()` or `multiprocessing.cpu_count()` can help with this.

### Load the Resnet50 model:
```python
model = torchvision.models.resnet50(pretrained=True)
```

This line uses the `torchvision.models.resnet50` function to load the Resnet50 model, with the pretrained parameter set to `True` to use the pretrained weights.

### Parallelize training across multiple GPUs

```
model = torch.nn.DataParallel(model)
```

`torch.nn.DataParallel` wraps a model and splits the input across available GPUs, then it replicates the model on each GPU. The model is then run in parallel on each GPU, with the results from each GPU being collected and concatenated together. Normally this significantly speeds up training process, especially for large models on GPUs with a high number of parallel processing cores.

### Move the model to the device:

```python
model.to(device)
```

This line moves the model and its parameters to the device specified earlier.

### Set the loss function and optimizer:
```python
criterion = torch.nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
```

The `torch.nn.CrossEntropyLoss` function creates a cross entropy loss criterion, which is commonly used for classification tasks. The `torch.optim.Adam` function creates an Adam optimizer with the specified learning rate. The `model.parameters()` method returns a list of the model's trainable parameters, which the optimizer will adjust during training.

### Train the model:

```python
for epoch in range(num_epochs):
    for inputs, labels in train_loader:
        # Move input and label tensors to the device
        inputs = inputs.to(device)
        labels = labels.to(device)

        # Zero out the optimizer
        optimizer.zero_grad()

        # Forward pass
        outputs = model(inputs)
        loss = criterion(outputs, labels)

        # Backward pass
        loss.backward()
        optimizer.step()

    # Print the loss for every epoch
    print(f'Epoch {epoch+1}/{num_epochs}, Loss: {loss.item():.4f}')
```

This block of code trains the model for 10 epochs. An epoch is a complete pass through the training data.

In each epoch, the code iterates over the dataloader, which yields batches of inputs and labels. The inputs and labels are moved to the device, and the gradients are zeroed using the `optimizer.zero_grad()` method. 

<blockquote>
During training process, gradients of the model's parameters are computed using backpropagation, which involves propagating the loss gradient back through the model's layers to compute the gradients of the model's parameters. These gradients are used to update model's parameters using the optimizer's update rule. <br/><br/>

However, if you don't zero gradients before each training step, gradients will accumulate and the update rule will be based on the sum of the gradients over all previous training steps. This can cause the model's parameters to oscillate or diverge, leading to poor convergence and potentially poor model performance. <br/><br/>

By calling <code>optimizer.zero_grad()</code> before each training step, you reset the gradients of the model's parameters to zero, ensuring that the update rule is based only on the gradients of the current training step.
</blockquote>

Next, the model performs a forward pass on the inputs, producing output logits. The loss is then computed using output logits and labels, and the model's gradients are computed using the `loss.backward()` method. Finally, the optimizer takes a step to update the model's parameters using gradients.

## Training environment with Docker

```dockerfile
FROM pytorch/pytorch

# Install additional dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip

# Copy Kaggle credentials 
RUN mkdir -p /root/.kaggle
ADD kaggle.json /root/.kaggle

# Install Kaggle toolchain and download imagenet 
# Rememeber to join competition https://www.kaggle.com/c/imagenet-object-localization-challenge
RUN pip install -q kaggle
RUN kaggle competitions download -c imagenet-object-localization-challenge

# Download pretrained model and store in the image layer 
# Available at the path /root/.cache/torch/
RUN python -c "import torchvision; model = torchvision.models.resnet50(pretrained=True)"

# Copy the code
COPY resnet50.py /app/

# Set the working directory
WORKDIR /app

# Run the code
CMD ["python", "resnet50.py"]
```

This `Dockerfile` is based on `pytorch/pytorch` image, which provides all necessary dependencies for running PyTorch programs with GPU acceleration.

The `Dockerfile` installs `wget` and `unzip` utilities, which are needed to download the ImageNet dataset. It then downloads the dataset and extracts images to the `imagenet-object-localization-challenge` directory.

Next, the Dockerfile copies `resnet50.py` file, which should contain the code for training the ResNet50 model, to the `/app` directory. It then sets the working directory to /app and specifies that the python `resnet50.py` command should be run when the container is started.

It is important to note that you have to provide your own secret in `kaggle.json` file to be able to download locally the data from [ImageNet Object Localization Challenge on Kaggle](https://www.kaggle.com/competitions/imagenet-object-localization-challenge/data). Here is the [local directory structure](https://github.com/moiseevigor/moiseevigor.github.io/tree/master/_code_examples/2022-12-18-one-pager-training-resnet-on-imagenet)

```
➜  2022-12-18-one-pager-training-resnet-on-imagenet git:(master) ✗ tree
.
├── .gitignore
├── Dockerfile
├── kaggle.json
└── resnet50.py
```


To build the Docker container, you can run the following command:

```bash
docker build -t resnet50 .
```

This will build the Docker container and tag it with the name "resnet50".

To run the container, you can use the following command:

```bash
docker run --gpus all -it resnet50
```

This will run the container with access to all available GPUs and start the container in interactive mode.

This will start the training of the ResNet50 model on the ImageNet dataset. You should see the running loss printed to the console as the training progresses.

I hope this helps! Let me know if you have any questions.

<div>
  <img id="ads_logo" alt="ads" src="/public/images/ads.png" style="max-width: 20px;" />
  <div class="image-grid">
    {% include page_tags_list_books.html %}
  </div>
</div>
