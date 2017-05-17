---
layout: post
title:  "An opinionated take-away from JSConf 2017, Verona"
description: "Opinionated take-away from JSConf 2017, Verona"
date:   2017-05-16 10:05:45
categories:
- software
tags:
- javascript
- react
- linux
comments: true
---

This is my opinionated take-away from [JSConf 2017, Verona](https://2017.jsday.it/). 
Here bellow I'll collect some of the most interesting slides, videos and tweets from JSDay.
But at first please meet the awesome speakers 

<blockquote class="twitter-tweet" data-lang="en" data-width="720"><p lang="en" dir="ltr">We want to thank all the <a href="https://twitter.com/hashtag/jsDay?src=hash">#jsDay</a> 2017 speakers! You are awesome!! <a href="https://t.co/uEn4NAdOya">pic.twitter.com/uEn4NAdOya</a></p>&mdash; JS Italian Conf (@jsconfit) <a href="https://twitter.com/jsconfit/status/862983424746934272">May 12, 2017</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>



## Uber with Dustin Whittle

[Dustin Whittle](https://twitter.com/dustinwhittle) had shown us the whole story behind the Uber platform

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">How <a href="https://twitter.com/hashtag/uber?src=hash">#uber</a> tech stack changed over the years! <a href="https://twitter.com/jsconfit">@jsconfit</a> <a href="https://twitter.com/hashtag/jsday?src=hash">#jsday</a> <a href="https://t.co/H5byJGxMxh">pic.twitter.com/H5byJGxMxh</a></p>&mdash; Luciano Mammino (@loige) <a href="https://twitter.com/loige/status/862578481816903680">May 11, 2017</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

Lessons learned building at scale with JS at @UberEng. "Enables you to move fast, but allows for sloppy code."


<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Lessons learned building at scale with JS at <a href="https://twitter.com/UberEng">@UberEng</a>.<br>&quot;Enables you to move fast, but allows for sloppy code.&quot; <a href="https://twitter.com/hashtag/jsday?src=hash">#jsday</a> <a href="https://t.co/OiqkGbJxpE">pic.twitter.com/OiqkGbJxpE</a></p>&mdash; Phil @ Codemotion (@philnash) <a href="https://twitter.com/philnash/status/862582052083945473">May 11, 2017</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>
- Latency is too high for ulta performant backed systems (99th percentile for max latency)
- Early on it made it quick to iterate, but as the size of the team scaled the developer velocity started to slow down
   - Microservices enforce a tight interface so having static typing enables large teams to catches issues earlier. It really has an impact with 100+ devs.
- Quick to learn, but easy to write poor quality code
   - Enables you to move fast, but allows for sloopy code


Uber uses universal javascript with [React](/tag/react) and Express.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/hashtag/Uber?src=hash">#Uber</a> uses <a href="https://twitter.com/hashtag/universal?src=hash">#universal</a> <a href="https://twitter.com/hashtag/javascript?src=hash">#javascript</a> with <a href="https://twitter.com/hashtag/react?src=hash">#react</a> and <a href="https://twitter.com/hashtag/express?src=hash">#express</a> 😮 <a href="https://twitter.com/hashtag/jsday?src=hash">#jsday</a> <a href="https://twitter.com/jsconfit">@jsconfit</a> <a href="https://t.co/dff6MakvWg">pic.twitter.com/dff6MakvWg</a></p>&mdash; Luciano Mammino (@loige) <a href="https://twitter.com/loige/status/862584479721938944">May 11, 2017</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

And here is the full slides 

<script async class="speakerdeck-embed" data-id="a097f66bb8c74a3a8da129896f1940cd" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>



<!-- Links

https://twitter.com/hashtag/jsDay?src=hash

Matteo Ronchi
https://twitter.com/cef62
https://speakerdeck.com/cef62/frontend-automation-bring-it-to-the-next-level-at-jsday-italy-2017


massimiliano mantione
http://massimiliano-mantione.github.io/talks/JsDay2017/OO
https://twitter.com/m_a_s_s_i

Fatos Hoti
https://speakerdeck.com/tosfa/what-the-hell-is-fiber-and-why-should-i-care
-->