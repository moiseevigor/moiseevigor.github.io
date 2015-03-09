---
layout: post
title:  "Find cracked email account with Mailq and Postfix"
description: ""
date:   2015-03-20 18:05:45
categories:
- software
tags:
- postfix
- linux
- ubuntu
comments: true
---

Prima fai mailq e trovi indirizzi email loschi del tipo

# mailq
8A411651A4     2485 Mon Mar  9 10:00:05  CartaSi_Informa@cartasi.it
(delivery temporarily suspended: lost connection with mx-eu.mail.am0.yahoodns.net[188.125.69.79] while sending RCPT TO)
                                         strong.shop@yahoo.it


Poi

# cat /var/log/mail.log| grep strong.shop@yahoo.it
Mar  9 10:00:05 server amavis[10554]: (10554-08-5) Passed CLEAN, [85.238.181.16] [85.238.181.16] <CartaSi_Informa@cartasi.it> -> <strong.shop@yahoo.it>, Message-ID: <20150309100001.6ADF707D2989F788@cartasi.it>, mail_id: be8nVRqbm-zR, Hits: -0.697, size: 2021, queued_as: 8A411651A4, 106 ms

Poi un ultimo grep

# cat /var/log/mail.log| grep 85.238.181.16| grep sasl| tail
Mar  9 10:05:51 server postfix/smtpd[22074]: 10C0D60C50: client=host16-181-238-85.hiway.at[85.238.181.16], sasl_method=LOGIN, sasl_username=info@brunoaita.it

Bingo! info@brunoaita.it è craccato, devi modificare password del account e comunicalo al cliente quando ripuliscono computer dal virus, probabilmente Conficker.


Poi quando hai bloccato account bisogna eliminare dalla coda email provenienti da CartaSi_Informa@cartasi.it

mailq | awk '/ CartaSi_Informa@cartasi.it$/ { print $1 }' | tr -d '*!' | postsuper -d -