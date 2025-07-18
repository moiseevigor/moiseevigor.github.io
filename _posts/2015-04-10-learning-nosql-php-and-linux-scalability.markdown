---
layout: page
title: Learning NoSQL, PHP and Linux
header: Categories
group: navigation
permalink: /learning-nosql-php-linux/
group: learning-nosql-php-linux
categories:
- programming
tags:
- linux
- ubuntu
- apache
- mongodb
- mysql
- php
comments: false
---

Series of lessons on [Linux](/tag/linux), [Apache](/tag/apache), [Databases](/tag/database), Git, NoSQL, [PHP](/tag/php) and scalability of the application. 

# Part 1:  Linux, Web server and Database 

<iframe src="//slides.com/igormoiseev/linux-database/embed" width="700" height="520" scrolling="no" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>


## Configuring Linux

Now we see how to setup the development environment. First download Linux (for ex. Linux Mint [www.linuxmint.com/download.php](https://www.linuxmint.com/download.php)) and install on Pen Drive following this tutorial [www.ubuntu.com/download/desktop/create-a-usb-stick-on-windows](https://www.ubuntu.com/download/desktop/create-a-usb-stick-on-windows). 

You may wish to install it as the second OS on your PC, see the manual [www.everydaylinuxuser.com/2014/07/how-to-install-linux-mint-alongside.html](https://www.everydaylinuxuser.com/2014/07/how-to-install-linux-mint-alongside.html).


When the Linux is up and running, 

![Linux Mint](/public/images/learning-nosql-php-linux-01.png)

the first to do is to upgrade it to the final release


```bash
$ sudo apt-get update; sudo apt-get dselect-upgrade
```

and reboot. 

## Statring with shell


What is "the shell" and why bother? The shell is a program that takes your commands from the keyboard and gives them to the operating system to perform. Nowadays, we have graphical user interfaces (GUIs) in addition to command line interfaces (CLIs) such as the shell. To open one simply click "Menu" and type "terminal"

![Terminal in Linux Mint](/public/images/learning-nosql-php-linux-02.png)


So why bother? 95% of servers is running Linux, most of them are headless -- without GUI!

![Linux Server Share in Internet](/public/images/learning-nosql-php-linux-03.svg)

So as we've seen before simple command like this one

```bash
$ sudo apt-get update; sudo apt-get dselect-upgrade
```

upgrades the entire operating system, or installs the web server

```bash
$ sudo apt-get install apache2
```


## Package managing `apt-get`

APT, the Advanced Packaging Tool, provide rapid, practical, and efficient way to install packages that would manage dependencies automatically and take care of their configuration files while upgrading.

### Commands

Installation commands

```bash
$ sudo apt-get install <package name>
```

Maintenance commands

Update sources

```bash
apt-get update
```

Upgrade all installed packages

```bash
apt-get upgrade
```

Upgrade all installed packages and tell APT to use "smart" conflict resolution system, and it will attempt to upgrade the most important packages as kernel etc.

```bash
apt-get dselect-upgrade
```

Remove package

```bash
apt-get remove <package_name>
```

Search available package

```bash
apt-cache search <search_term>
```


Search for installed package

```bash
dpkg -l *<search_term>*
```


## `GIT`

[`GIT`](/tag/git) is a distributed revision control system with an emphasis on speed, data integrity, and support for distributed, non-linear workflows.
Git was initially designed and developed by Linus Torvalds for [Linux](/tag/linux) kernel development in 2005, and has since become the most widely adopted version control system for software development.

```bash
$ sudo apt-get install git-core
```

## Github

[GitHub](/tag/github) is a web-based Git repository hosting service, which offers all of the distributed revision control and source code management (SCM) functionality of Git as well as adding its own features.  

### GitHub for Mac And Windows

GitHub offers very handy utilities for Mac and Windows that enables managing repositories via graphical interface. 

 - GitHub for Mac: https://mac.github.com/
 - GitHub for Windows: https://windows.github.com/

 ![GitHub for Mac](/public/images/learning-nosql-php-linux-04.png)


## Editors and IDE

For Web development there is a big choice of editors and IDE-s available. Let's consider some of them

### Sublime Text

[Sublime Text](https://www.sublimetext.com/) is a sophisticated text editor for code, markup and prose. You'll love the slick user interface, extraordinary features and amazing performance.

![Sublime Text](/public/images/learning-nosql-php-linux-05.png)

### NetBeans IDE

[NetBeans](https://netbeans.org/features/php/) provides full IDE functionality and is a typical choice for [PHP](/tag/php) web development.

![NetBeans IDE](/public/images/learning-nosql-php-linux-06.png)


## Exercises 

### Exercise 1
Please install Apache web server and create "Hello world" page.

### Exercise 2
Install GIT. Register un account su GitHub and Install the GIT Gui.

### Exercise 4
Please install MySQL server, MySQL PHPMyAdmin and MySQL Workbench. Create test database.

### Exercise 5
Clone repository https://github.com/ccoenraets/wine-cellar-php and configure Apache and MySQL to run application.

####Hints

 - Create new Droplet Ubuntu 14.04 x64 on [DigitalOcean](https://digitalocean.com)
 - install apache2 and mysql: [digitalocean.com/community/tutorials/how-to-install-linux-apache-mysql-php-lamp-stack-on-ubuntu-14-04](https://www.digitalocean.com/community/tutorials/how-to-install-linux-apache-mysql-php-lamp-stack-on-ubuntu-14-04)
 - enable `rewrite` module with

```bash
$ sudo a2enmon rewrite
```

 - permit path rewrite 

```bash
$ sudo nano /etc/apache2/sites-enabled/000-default.conf

<VirtualHost *:80>

...

    <Directory /var/www/html>
            Options FollowSymLinks
            AllowOverride All
            Order allow,deny
            Allow from all
    </Directory>

...

</VirtualHost>
```

 - clone repository into cellar folder 

```bash
/var/www/html$ sudo git clone https://github.com/ccoenraets/wine-cellar-php.git cellar`
```

### Exercise 6 (advanced, requires knowledge of basics of NodeJS e NPM)
Install Ghost Blogging platfowm https://github.com/TryGhost/Ghost and create one post

#### Hints

 - Installation for all platforms https://support.ghost.org/installation/
 - Or alternatively, cofigure with DigitalOcean (create new Droplet Ubuntu 12.04.5 x64) [digitalocean.com/community/tutorials/how-to-host-ghost-with-nginx-on-digitalocean](https://www.digitalocean.com/community/tutorials/how-to-host-ghost-with-nginx-on-digitalocean) 


# Part 2:  RESTful Web Services

<iframe src="//slides.com/igormoiseev/web-service/embed" width="760" height="520" scrolling="no" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>

## Web Server 

At first install [`Apache`](/tag/apache) web server, we suppose Ubuntu 14.04 installed on server,

```bash
$ sudo apt-get install apache2
```

Then let's assume the name of the website is `example.com`, so we configure Apache to serve content for this website from the folder 
`/var/www/html/example.com`

```bash
$ sudo nano /etc/apache2/sites-available/example.com.conf
```

And put the `VirtualHost` description 

```bash
<VirtualHost *:80>
    ServerName  www.example.com
    ServerAlias example.com

    DirectoryIndex index.html index.php index.htm
    DocumentRoot /var/www/html/example.com/public

    <Directory "/var/www/html/example.com/public">
        Options MultiViews FollowSymLinks
        AllowOverride all
        Order allow,deny
        Allow from all
    </Directory>

    # Logfiles
    ErrorLog  /var/log/apache2/example.com/error.log
    CustomLog /var/log/apache2/example.com/access.log combined
</VirtualHost>
```

Create corresponding folders

```bash
$ sudo mkdir -p /var/www/html/example.com/public /var/log/apache2/example.com/
```

and enable the website 

```bash
$ sudo a2ensite 
Your choices are: 000-default default-ssl example.com
Which site(s) do you want to enable (wildcards ok)?
example.com
Enabling site example.com.
To activate the new configuration, you need to run:
  service apache2 reload
```

then reload conf 

```bash
$ sudo service apache2 reload
```


## PHP Composer

Here we'll see how to create a simple PHP web service with the help of [Composer](https://getcomposer.org/). Composer is a tool for dependency management in PHP. It allows you to declare the dependent libraries your project needs and it will install them in your project for you.

```bash
$ cd /var/www/html & rm -rf example.com
```

now clone the source code

```bash
$ /var/www/html$ sudo git clone https://github.com/moiseevigor/learning-nosql-php example.com
```

Switch to the folder of the project

```bash
$ cd example.com 
```

And switch to "Hello world" branch

```bash
$ git checkout -b hello-world origin/hello-world
```

Install composer 

```bash
$ sudo curl -sS https://getcomposer.org/installer | sudo php
```

and configure dependences

```bash
$ sudo ./composer.phar install
```

The latter will create folder `vendor` in current folder, that will contains all PHP libraries that our project will depend on.

## PHP Server

To run the application just simply switch to `public`

```bash
$ cd public
```

and start built-in web server on `localhost`. 

```bash
$ php -S localhost:8080
```

Note, the built-in web server is available only for version of `PHP` >5.4.

Now open browser on  `https://localhost:8080/hello/world` or try it via `telnet`


```bash
$ telnet localhost 8080
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
GET /hello/world HTTP/1.1
host: localhost

HTTP/1.1 200 OK
Host: localhost
Connection: close
X-Powered-By: PHP/5.5.9-1ubuntu4.6
Content-Type: text/html

Hello, world
```

## Project Learning NoSQL e PHP
Project Learning NoSQL e PHP, https://github.com/moiseevigor/learning-nosql-php, contains a number of branches. 
After previous step we find ourselves at `hello-world` branch. 

```bash
/var/www/html/example.com (models)$ git branch
  master
* hello-world
  controllers
  models
```

You need to explore the project in the following order

 - `hello-world`: basic routing and functionality
 - `controllers`: introduction of Controller and advanced routing
 - `models`: introduction of Models and Doctrine ORM

 To switch between branches you need to execute

```bash
$ git checkout -b hello-world origin/hello-world
$ git checkout -b controllers origin/controllers
$ git checkout -b models origin/models
```

After every switch you need to update libraries with 

```bash
$ ./composer.phar update
```


# Part 3: Databases NoSQL vs SQL

<iframe src="//slides.com/igormoiseev/nosql-vs-sql/embed" width="760" height="520" scrolling="no" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>
