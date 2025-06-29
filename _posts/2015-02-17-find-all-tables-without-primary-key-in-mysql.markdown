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

## Search across all databases (schemas) for tables without primary key

The following query obtains the list of tables without primary key, those who destroys the database performance

```sql
SELECT 
    t.TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES AS t
LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS k
ON (
       t.TABLE_NAME = k.TABLE_NAME
   AND k.CONSTRAINT_SCHEMA = t.TABLE_SCHEMA
   AND k.constraint_name = 'PRIMARY'
)
WHERE 
    t.TABLE_SCHEMA NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
AND k.constraint_name IS NULL;
```

In this example, the `INFORMATION_SCHEMA.TABLES` table is used to find all t. The `TABLE_NAME` column is selected, and the `WHERE` clause is used to filter system related databases.

`LEFT JOIN` is used to join with table `KEY_COLUMN_USAGE` and filter the tables that do not have a primary key.

## Restrict search for tables without primary key to a specific databases (schema)

```sql
SELECT 
    t.TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES AS t
LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS k
ON (
       t.TABLE_NAME = k.TABLE_NAME
   AND k.CONSTRAINT_SCHEMA = t.TABLE_SCHEMA
   AND k.constraint_name = 'PRIMARY'
)
WHERE 
    t.TABLE_SCHEMA NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
AND t.TABLE_SCHEMA = '<database name>' -- put database name here
AND k.constraint_name IS NULL;
```

A friendly advise, the result list of these queries should be an `Empty set`. 

Happy querying!


