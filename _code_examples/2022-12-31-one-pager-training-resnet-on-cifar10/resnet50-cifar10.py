import torch
import torchvision
import torchvision.transforms as transforms
from tqdm import tqdm
from torchvision.transforms.autoaugment import AutoAugmentPolicy
from tensorboardX import SummaryWriter

import threading

# Define a function to run in a separate thread
def input_thread():
    global lr
    global optimizer
    
    # Start a loop to continuously check for user input
    while True:
        # Prompt the user for input
        user_input = input("Enter a value for LR or type 'stop' to exit: ")
        
        # If the user enters "stop", exit the loop
        if user_input == "stop":
            break
        
        # If the user enters a valid value for x, update it
        try:
            lr = [float(user_input)]
            for param_group in optimizer.param_groups:
                param_group['lr'] = lr[0]
        except ValueError:
            print("Invalid value for LR. Try again.")

# Create a separate thread to run the input function
input_thread = threading.Thread(target=input_thread)

# Start the input thread
input_thread.start()


# Set device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Set hyperparameters
num_epochs = 100
batch_size = 400

transform = transforms.Compose([
    transforms.RandomHorizontalFlip(),
    # transforms.RandomCrop(32, 4),
    transforms.AutoAugment(AutoAugmentPolicy.CIFAR10),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.491, 0.482, 0.447], std=[0.247, 0.243, 0.262])
])

# Load the CIFAR-10 dataset for training
train_dataset = torchvision.datasets.CIFAR10(
    root='/kaggle/input', 
    train=True, 
    download=True, 
    transform=transform
)
train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=6)

# Load the CIFAR-10 dataset for validation
val_dataset = torchvision.datasets.CIFAR10(
    root='/kaggle/input', 
    train=False, 
    download=True, 
    transform=transforms.Compose([
        # transforms.RandomCrop(32, 4),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.491, 0.482, 0.447], std=[0.247, 0.243, 0.262])
    ])
)
val_loader = torch.utils.data.DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=6)

# Load the ResNet50 model and initialize 10 classes
model = torchvision.models.resnet50(num_classes=10)

# Add dropout after the fully connected layer
num_ftrs = model.fc.in_features
model.fc = torch.nn.Sequential(
    torch.nn.Linear(num_ftrs, num_ftrs),
    torch.nn.ReLU(),
    torch.nn.Dropout(p=0.5),  # Dropout with probability 0.5
    torch.nn.Linear(num_ftrs, 10)
)

# Initialize the weights of the model using Kaiming normal initialization
for m in model.modules():
    if isinstance(m, torch.nn.Conv2d):
        torch.nn.init.kaiming_normal_(m.weight, mode='fan_in', nonlinearity='relu')
    elif isinstance(m, torch.nn.BatchNorm2d):
        m.weight.data.fill_(1)
        m.bias.data.zero_()

# Define the maximum gradient norm
max_norm = 1.0

# Parallelize training across multiple GPUs
model = torch.nn.DataParallel(model)

# Set the model to run on the device
model = model.to(device)

# Define the loss function and optimizer
criterion = torch.nn.CrossEntropyLoss()

# for lr in [0.0001, 0.0002, 0.0005, 0.0010, 0.0015, 0.002, 0.003, 0.005, 0.01, 0.02]:
#     print(f'SGD Experiment for lr:{lr}')

# Initialize the weights of the model using Kaiming normal initialization
for m in model.modules():
    if isinstance(m, torch.nn.Conv2d):
        torch.nn.init.kaiming_normal_(m.weight, mode='fan_in', nonlinearity='relu')
    elif isinstance(m, torch.nn.BatchNorm2d):
        m.weight.data.fill_(1)
        m.bias.data.zero_()

# Create a SummaryWriter object
writer = SummaryWriter(f'/app/experiments/sgd-interactive-lr-momentum/exp-4-resnet18-actual-clippedgrad')

lr = [0.35]
# max_lr = 0.01
# final_lr = 0.0001
# max_momentum = 1
min_momentum = 0.95
# optimizer = torch.optim.Adam(model.parameters(), lr=lr[0])
# optimizer = torch.optim.AdamW(model.parameters(), lr=lr[0], weight_decay=0.0001)
optimizer = torch.optim.SGD(model.parameters(), lr=lr[0], momentum=min_momentum)

# Define the learning rate scheduler
scheduler = torch.optim.lr_scheduler.OneCycleLR(
    optimizer,
    max_lr=0.35,
    # total_steps=batch_size*num_epochs,
    epochs=num_epochs,
    steps_per_epoch=len(train_loader),
    pct_start=0.125,
    anneal_strategy='linear',
    cycle_momentum=True,
    base_momentum=0.85,
    max_momentum=0.95,
    div_factor=3.0,
    final_div_factor=10.0,
    three_phase=True
)

# Train the model...
train_iteration_counter = -1
val_iteration_counter = -1
img = torch.zeros(3, num_epochs, len(val_dataset))

for epoch in range(num_epochs):
    # Initialize a progress bar
    progress_bar = tqdm(total=len(train_loader), desc=f'Epoch {epoch+1}/{num_epochs}')

    train_loss = 0
    train_acc = 0
    true_labels = []
    pred_labels = []

    model.train()
    for inputs, labels in train_loader:
        train_iteration_counter += 1

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

        gradients = torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm)
        optimizer.step()

        # Step the learning rate scheduler
        scheduler.step()
        lr = scheduler.get_last_lr()

        # Calculate the accuracy
        _, preds = torch.max(outputs, dim=1)
        acc = (preds == labels).float().mean()
        true_labels.append(labels)
        pred_labels.append(preds)

        train_loss += loss.item()
        train_acc += acc.item()

        # Update the progress bar and tensorboard summary
        progress_bar.set_postfix(lr=lr[0], train_loss=loss.item(), train_acc=acc.item())
        progress_bar.update()

        writer.add_scalar('Loss/train', loss.item(), train_iteration_counter)
        writer.add_scalar('Accuracy/train/iter', acc.item(), train_iteration_counter)
        writer.add_scalar('LR', lr, train_iteration_counter)

    # Calculate the average train loss and accuracy
    train_loss /= len(train_loader)
    train_acc /= len(train_loader)

    # Validation
    model.eval()
    with torch.no_grad():
        val_loss = 0
        val_acc = 0
        true_labels = []
        pred_labels = []

        for inputs, labels in val_loader:
            val_iteration_counter += 1

            # Move input and label tensors to the device
            inputs = inputs.to(device)
            labels = labels.to(device)

            # Forward pass
            outputs = model(inputs)
            loss = criterion(outputs, labels)

            # Calculate the accuracy
            _, preds = torch.max(outputs, dim=1)
            acc = (preds == labels).float().mean()
            true_labels.append(labels)
            pred_labels.append(preds)

            val_loss += loss.item()
            val_acc += acc.item()

            writer.add_scalar('Loss/val/iter', loss.item(), val_iteration_counter)
            writer.add_scalar('Accuracy/val/iter', acc.item(), val_iteration_counter)

        # Calculate the average validation loss and accuracy
        val_loss /= len(val_loader)
        val_acc /= len(val_loader)

        # Update the progress bar and tensorboard summary
        progress_bar.set_postfix(lr=lr[0], train_loss=train_loss, train_acc=train_acc, val_loss=val_loss, val_acc=val_acc)
        writer.add_scalar('Loss/val', val_loss, epoch)
        writer.add_scalar('Accuracy/val', val_acc, epoch)

        # Concatenate the true labels and predicted labels
        true_labels = torch.cat(true_labels)
        pred_labels = torch.cat(pred_labels)

        # Set the pixel value to [0, 1, 0] (green) if the prediction is correct, and [1, 0, 0] (red) if the prediction is incorrect
        img[0, epoch, :] = (pred_labels != true_labels).float()
        img[1, epoch, :] = (pred_labels == true_labels).float()

# Write the prediction image to tensorboard
writer.add_image('Prediction image', img)
writer.close()

print(f'Finished Training for lr:{lr}, Loss: {loss.item():.4f}')
