---
layout: post
title:  "Configure TLS support in Postfix for email encryption in transit"
description: "Configure TLS support in Postfix for email encryption in transit"
date:   2016-02-10 10:05:45
categories:
- software
tags:
- linux
- ubuntu
- git
comments: true
---

When you install `git` on your computer, you may find new variables available in the environment, it is `$(__git_ps1)`.
This variable contains the branch name of the current repository. The only thing you need to edit `~/.bashrc`
and add `$(__git_ps1)` to the `PS1` definition in this way

https://giantdorks.org/alain/fix-for-postfix-untrusted-certificate-tls-error/
https://wiki.lenux.org/configure-postfix-with-tls/
https://support.google.com/mail/answer/6330403?p=tls&hl=en&rd=1
https://www.google.com/transparencyreport/saferemail/tls/?hl=en


Feb 11 10:43:30 mail1 postfix/smtp[10208]: Untrusted TLS connection established to gmail-smtp-in.l.google.com[64.233.167.27]:25: TLSv1.2 with cipher ECDHE-RSA-AES128-GCM-SHA256 (128/128 bits)

google_tls_landing_landscape2.jpg 



