---
layout: post
title:  "Find all tables without primary key in MySQL"
description: "Query that helps to find tables without primary key, simple and efficient way to find performance bottlenecks"
date:   2015-02-17 19:05:45
categories:
- programming
tags:
- mysql
- database
- ubuntu
comments: true
---

The following query obtains the list of tables without primary key, those who destroys the database performance

{% highlight sql %}
USE INFORMATION_SCHEMA;
SELECT 
    TABLES.table_name
FROM TABLES
LEFT JOIN KEY_COLUMN_USAGE AS c 
ON (
       TABLES.TABLE_NAME = c.TABLE_NAME
   AND c.CONSTRAINT_SCHEMA = TABLES.TABLE_SCHEMA
   AND c.constraint_name = 'PRIMARY'
)
WHERE 
    TABLES.table_schema <> 'information_schema'
AND TABLES.table_schema <> 'performance_schema'
AND TABLES.table_schema <> 'mysql'
AND c.constraint_name IS NULL;
{% endhighlight %} 

A friend advise: "The result list of this query should be `Empty set`". 

Happy querying!
