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
#RUN kaggle competitions download -c imagenet-object-localization-challenge
#RUN unzip imagenet-object-localization-challenge.zip -d imagenet-object-localization-challenge

# Download pretrained model and store in the image layer 
# Available at the path /root/.cache/torch/
RUN python -c "import torchvision; model = torchvision.models.resnet50(pretrained=True)"

RUN pip install -q tensorboard tensorboardx

# Copy the code
COPY resnet50-imagenet.py /app/

# Set the working directory
WORKDIR /app

# Run the code
CMD ["python", "resnet50-imagenet.py"]
