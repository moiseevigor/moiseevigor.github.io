import torch
import torchvision
import torchvision.transforms as transforms
from tqdm import tqdm

from torchvision.transforms.autoaugment import AutoAugmentPolicy

from tensorboardX import SummaryWriter

# Create a SummaryWriter object
writer = SummaryWriter('/kaggle/input/tensorboard')

# Set device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Set hyperparameters
num_epochs = 10
batch_size = 64
learning_rate = 0.01

# Initialize transformations for data augmentation
# transform = transforms.Compose([
#     transforms.Resize(256),
#     transforms.RandomHorizontalFlip(),
#     transforms.RandomVerticalFlip(),
#     transforms.RandomRotation(degrees=45),
#     transforms.ColorJitter(brightness=0.5, contrast=0.5, saturation=0.5, hue=0.5),
#     transforms.CenterCrop(224),
#     transforms.ToTensor(),
#     transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
# ])

transform = transforms.Compose([
    transforms.Resize(96),
    transforms.CenterCrop(80),
    transforms.AutoAugment(AutoAugmentPolicy.IMAGENET),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Load the ImageNet Object Localization Challenge dataset
train_dataset = torchvision.datasets.ImageFolder(
    root='/kaggle/input/imagenet-object-localization-challenge/ILSVRC/Data/CLS-LOC/train', 
    transform=transform
)

train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=6)

# Load the ResNet50 model and initialize 1000 classes
model = torchvision.models.resnet50(num_classes=1000)

# Initialize the weights of the model using Kaiming normal initialization
for m in model.modules():
    if isinstance(m, torch.nn.Conv2d):
        torch.nn.init.kaiming_normal_(m.weight, mode='fan_in', nonlinearity='relu')
    elif isinstance(m, torch.nn.BatchNorm2d):
        m.weight.data.fill_(1)
        m.bias.data.zero_()

# Parallelize training across multiple GPUs
model = torch.nn.DataParallel(model)

# Set the model to run on the device
model = model.to(device)

# Define the loss function and optimizer
criterion = torch.nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)

# Train the model...
for epoch in range(num_epochs):
    # Initialize a progress bar
    progress_bar = tqdm(total=len(train_loader), desc=f'Epoch {epoch+1}/{num_epochs}')

    iteration_counter = -1
    for inputs, labels in train_loader:
        iteration_counter += 1
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

        # Update the progress bar
        progress_bar.set_postfix(loss=loss.item())
        writer.add_scalar('Loss/train', loss.item(), iteration_counter)
        progress_bar.update()

    # Print the loss for every epoch
    print(f'Epoch {epoch+1}/{num_epochs}, Loss: {loss.item():.4f}')

writer.close()
print(f'Finished Training, Loss: {loss.item():.4f}')