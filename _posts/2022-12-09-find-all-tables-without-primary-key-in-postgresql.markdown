---
layout: post
title:  "Find all tables without primary key in PostgreSQL"
description: "Query that helps to find tables without primary key, simple and efficient way to find performance bottlenecks"
date:   2022-12-09 06:05:45
categories:
- programming
tags:
- postgresql
- database
- linux
comments: true
---

The following query obtains the list of tables without primary key, those who destroys the database performance

```sql
SELECT
	t.table_name
FROM information_schema.tables as t
LEFT JOIN information_schema.table_constraints as tc 
ON (
        t.table_schema = t.table_schema
    AND t.table_name = tc.table_name 
    AND tc.constraint_type = 'PRIMARY KEY'
)
WHERE 
	t.table_type = 'BASE TABLE'
AND t.table_schema not in ('pg_catalog', 'information_schema')
AND tc.constraint_name is NULL
```

In this example, the table `tables` is used to find all tables registered in PostgreSQL and `LEFT JOIN` with `table_constraints` is used to select relative constraints.

`WHERE` clause is used to filter out the system related databases and filter the tables that do not have a primary key.

A friendly advise: "The result list of this query should be an `Empty set`". 

Happy querying!
