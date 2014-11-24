Ceph manage wisely your cache setting


rbd cache = true
rbd cache size = 67108864 # (64MB)
rbd cache max dirty = 50331648 # (48MB)
rbd cache target dirty = 33554432 # (32MB)
rbd cache max dirty age = 2
rbd cache writethrough until flush = true
