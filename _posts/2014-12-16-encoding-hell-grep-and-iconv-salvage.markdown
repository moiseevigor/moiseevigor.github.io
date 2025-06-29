---
layout: post
title:  "Encoding hell, grep and iconv salvage!"
description: "Howto extract records from dump, when database encoding is different to one set on the connection"
date:   2014-12-16 18:05:45
categories:
- programming
tags:
- mysql
- database
- encoding
- unicode
- ubuntu
- linux
comments: true
---

Nowadays we inherit a lot of old databases. 
The typical problem is to extract data from badly encoded fields. 
This happens when the browser encoding is forced to let say `UTF8` 
and `MySQL` is accepting the the default `LATIN1` encoding. In this case
the problem does not manifests immediately since the byte sequence corresponding to 
the single character remains immute during the saving and retrieval, but become a problem 
when dumped and migrated. 

Lets get workaround this problem. At first find non `ASCII` characters in the dump file 

```bash
grep --color='auto' -P "[\x80-\xFF]" FILENAME
```

Now let's work it out with `iconv`

```bash
iconv --verbose -f LATIN1 -t UTF8//TRANSLIT FILENAME_latin1 > FILENAME_utf8
```

If you get the followinf message

```bash
iconv: illegal input sequence at position <NUMBER>
```

this is a good sign of badly encoded character, you may correct it with vim, just type in command mode

```bash
:goto <NUMBER>
```

Taking into account that you're working with `UTF8` locale session in terminal

```bash
user@host:~$ locale 
LANG=en_US.UTF-8
LANGUAGE=en_US:
LC_CTYPE="en_US.UTF-8"
```

After you're finished, just save the file and import it into `UTF8` encoded fields of the database!

