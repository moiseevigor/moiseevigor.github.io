---
layout: post
title:  "The rmagic gem trouble on linux"
description: "Howto solve installation problems with rmagic gem on ruby"
date:   2017-02-17 18:05:45
categories:
- programming
tags:
- imagemagick
- ubuntu
- rubygems
- linux
comments: true
---

Hope this tip will save to someone time for fun coding, if you suddenly get this error while installing the [RMagick gem](https://rubygems.org/gems/rmagick) on linux

{% highlight bash %}
$ sudo gem install rmagick
Building native extensions.  This could take a while...
ERROR:  Error installing rmagick:
    ERROR: Failed to build gem native extension.
Can't install RMagick 2.13.4. Can't find Magick-config
{% endhighlight %}

That means the devel package is not installed, so you pick it up on Ubuntu > 12.04 with this command

{% highlight bash %}
$ sudo apt-get install libmagick++-dev
{% endhighlight %}

and voilà 

{% highlight bash %}
$ sudo gem install rmagick
Building native extensions.  This could take a while...
Please report any bugs. See https://github.com/gemhome/rmagick/compare/RMagick_2-13-2...master and https://github.com/rmagick/rmagick/issues/18
Successfully installed rmagick-2.13.4
Parsing documentation for rmagick-2.13.4
Installing ri documentation for rmagick-2.13.4
Done installing documentation for rmagick after 7 seconds
1 gem installed
{% endhighlight %}

checkout if everything is OK

{% highlight bash %}
$ dpkg -l | grep imagemagick
ii  imagemagick          8:6.7.7.10+dfsg-4ubuntu1   amd64        image manipulation programs
ii  imagemagick-common   8:6.7.7.10+dfsg-4ubuntu1   all          image manipulation programs -- infrastructure

$ gem list | grep rmagick
rmagick (2.13.4)

{% endhighlight %}
