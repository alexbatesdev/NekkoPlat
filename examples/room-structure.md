# ROOMS: (id: room)

## Star Isle Rooms
0: Space Station
1: Space Port
2: Observatory
3: Star Isle Port
4: UFO

## Dolphin Island Rooms
5: Dolphin Island Port
6: Little Big City
7: Little Big Beach
8: Mountain Base
9: Mountain Cave
10: Mountain Peak
11: Fungi Forest
12: Halloween Hills
13: Giant Robot City
14: Giant Robot Harbor
15: Secret Gulf

# Room Relationships
0 - Space Station
  - 1

1 - Space Port
  - 0
  - 2
  - 3

2 - Observatory
  - 1
  - 3

3 - Star Isle Port
  - 1
  - 2
  - 5
  - 14

4 - UFO
  - 0
  - Special Rule: UFO is the 404 Room. It is not reachable by normal means, and is only accessible via going to a non-existent room URL.

5 - Dolphin Island Port
  - 3
  - 6
  - 7
  - 14

6 - Little Big City
  - 5
  - 7
  - 10

7 - Little Big Beach
  - 5
  - 6
  - 8

8 - Mountain Base
  - 7
  - 9
  - 11

9 - Mountain Cave
  - 8
  - 10
  - 11
  - 15

10 - Mountain Peak
  - 6
  - 9

11 - Fungi Forest
  - 8
  - 9
  - 12

12 - Halloween Hills
  - 11
  - 13

13 - Giant Robot City
  - 12
  - 14
  - 16

14 - Giant Robot Harbor
  - 3
  - 5
  - 13

15 - Secret Gulf
  - 9

16 - Giant Robot Innards
  - 13