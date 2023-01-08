FROM pytorch/pytorch

# Install additional dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip

# Copy Kaggle credentials 
RUN mkdir -p /root/.kaggle
ADD kaggle.json /root/.kaggle

# Install Kaggle toolchain and download dataset
# Rememeber to join competition 
# RUN pip install -q kaggle
#RUN kaggle competitions download -c imagenet-object-localization-challenge
#RUN unzip imagenet-object-localization-challenge.zip -d imagenet-object-localization-challenge

RUN python -c "import torchvision; train_dataset = torchvision.datasets.CIFAR10( \
    root='/kaggle/input', \
    download=True, \
)"

RUN pip install -q tensorboard tensorboardx tqdm torch-lr-finder

# Copy the code
COPY resnet50-cifar10.py /app/

# Set the working directory
WORKDIR /app

# Run the code
CMD ["python", "resnet50-cifar10.py"]
