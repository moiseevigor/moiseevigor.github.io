Speedup your KVM migration in Proxmox


http://pve.proxmox.com/pipermail/pve-devel/2013-July/008429.html
http://forum.proxmox.com/threads/15433-Proxmox-VE-3-1-beta-%28pvetest%29

/etc/pve/datacenter.cfg
migration_unsecure: 1


Nov 24 12:42:19 starting migration of VM 116 to node 'nodo4' (10.0.2.14)
Nov 24 12:42:19 copying disk images
Nov 24 12:42:19 starting VM 116 on remote node 'nodo4'
Nov 24 12:42:35 starting ssh migration tunnel
Nov 24 12:42:36 starting online/live migration on 10.0.2.14:60000
Nov 24 12:42:36 migrate_set_speed: 8589934592
Nov 24 12:42:36 migrate_set_downtime: 0.1
Nov 24 12:42:38 migration status: active (transferred 728684636, remaining 5655494656), total 6451433472)
Nov 24 12:42:40 migration status: active (transferred 1465523175, remaining 4865253376), total 6451433472)

....

Nov 24 12:42:55 migration status: active (transferred 7115710846, remaining 69742592), total 6451433472)
Nov 24 12:42:55 migration speed: 323.37 MB/s - downtime 262 ms
Nov 24 12:42:55 migration status: completed
Nov 24 12:42:58 migration finished successfuly (duration 00:00:39)
TASK OK




Nov 24 12:26:41 starting migration of VM 123 to node 'nodo5' (10.0.2.15)
Nov 24 12:26:41 copying disk images
Nov 24 12:26:41 starting VM 123 on remote node 'nodo5'
Nov 24 12:26:43 starting ssh migration tunnel
Nov 24 12:26:43 starting online/live migration on localhost:60000
Nov 24 12:26:43 migrate_set_speed: 8589934592
Nov 24 12:26:43 migrate_set_downtime: 0.1
Nov 24 12:26:45 migration status: active (transferred 133567908, remaining 930062336), total 1082789888)
Nov 24 12:26:47 migration status: active (transferred 273781779, remaining 788221952), total 1082789888)

...

Nov 24 12:26:58 migration status: active (transferred 1036346176, remaining 20889600), total 1082789888)
Nov 24 12:26:58 migration status: active (transferred 1059940218, remaining 11558912), total 1082789888)
Nov 24 12:26:59 migration speed: 64.00 MB/s - downtime 54 ms
Nov 24 12:26:59 migration status: completed
Nov 24 12:27:02 migration finished successfuly (duration 00:00:21)
TASK OK