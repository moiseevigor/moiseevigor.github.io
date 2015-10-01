#!/usr/bin/env bash
# Variables
APPENV=local
DBHOST=localhost
DBUSER=root
DBPASSWD=wirentt4

apt-get update
#apt-get -y dselect-upgrade
apt-get purge -y apparmor
apt-get install -y language-pack-it language-selector-common htop bmon sysstat iftop vim lynx sshfs sudo
apt-get -y install build-essential git ruby1.9.3 ruby-dev zlib1g-dev
gem install github-pages therubyracer --no-ri --no-rdoc

cd /vagrant
#jekyll serve