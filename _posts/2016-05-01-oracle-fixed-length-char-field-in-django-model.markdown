---
layout: post
title:  "Oracle fixed length CHAR field in Django"
description: "How to correctly trim spaces in Django model CharField to represent the Oracle's fixed length CHAR field"
date:   2016-05-01 10:05:45
categories:
- programming
tags:
- django
- oracle
- python
- ubuntu
comments: true
---

When you're developing the [Django](/tag/django) app based on the legacy [Oracle](/tag/oracle) database you'll find this type of model   

```python
from django.db import models

class Product(models.Model):
    type_product = models.CharField(max_length=3)
    code_product = models.CharField(max_length=15)
    price = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        unique_together = (('type_product', 'code_product'),)

```

where the primary key is made by the tuple `('type_product', 'code_product')`.
The field `code_product` usually is filled by some characters and the rest is padded with spaces
to respect the Oracle's `CHAR(15)` type. You may wish to trim those spaces in your REST web-service, but still
wish to filter lists and to join on foreign keys. 

Here is my hack of this problem, the `CharFieldPadding` class register the new character field in Django that 
call handy [`ljust`](https://docs.python.org/2/library/string.html#string.ljust) function to pad the string with spaces and respect the `max_length` parameter.

```python
from django.db import models

class CharFieldPadding(models.CharField):
    def __init__(self, max_length, *args, **kwargs):
        kwargs['max_length'] = max_length

        super(CharFieldPadding, self).__init__(*args, **kwargs)

    def get_prep_value(self, value):
        return value.ljust(self.max_length, ' ')


class Product(models.Model):
    type_product = models.CharField(max_length=3)
    code_product = CharFieldPadding(max_length=15)
    description = models.CharField(max_length=120, blank=True, null=True)

    class Meta:
        unique_together = (('type_product', 'code_product'),)

```

Everything works smoothly in [Django Rest Framework](http://www.django-rest-framework.org/) and you have nice looking URLs.

Happy coding!
