### General
The "playing area" is defined as the region between the 4.1°E and 4.7°E meridians and between the 51.8°N and 52.2°N parallels.

### Regions

A "region" is an area in the game which can be claimed, has a point of interest and a challenge that must be completed there.

`regions.json` contains an array of all of the regions in the game, and storing static information about each region. Each array entry is an object containing the following properties:
- name - the name of the region displayed to the user. This is also used as a unique identifier
- building - the name of the point of interest in the region
- station - a comma-separated list of train stations, tram stops and metro stations close to the building. Train stations are followed by "(NS)". Tram stops in Den Haag operated by HTM trams are followed by "(HTM)". Tram stops and metro stations in Rotterdam operated by RET trams and trains are followed by "(RET)"
- position - a `{ latitude, longitude, accuracy }` object describing the coordinates of the building. The accuracy field should be set to 0, indicating that there is 0 uncertainty in the position of the building. This is used for distance calculations
- challenge - a description of the challenge for the region. The description should be precise, outline limits and restrictions for completing the challenge, and provide clear success/fail conditions. The description should *not* include the time limit for the challenge
- time - the number of minutes available to complete the challenge. This time should start when the player finishes reading the challenge description

`polygons.json` stores information about the boundary of each region. A player must be inside this polygon in order to claim the region. Regions should be non-overlapping. The file is structured as an object mapping the region name to its polygon. The polygon is structured as an array of points. Each point is an array of `[longitude, latitude]`, similar to GeoJSON. This information is also static, but is stored separately to the rest of the data due to its large size and infrequent usage.

Dynamic information about regions such as ownership is stored using Deno KV. The path `["region", regionName, "claimer"]` stores the name of the team who claimed the region. `["region", regionName, "challengers"]` stores an object of all teams who have attempted the region's challenge, mapping the team name to a boolean indicating whether they were successful. For example, if the "Red" team has attempted the challenge but failed, "Green" team attempted the challenge and succeeded, and "Blue" team has not attempted the challenge, then the object would be `{ Red: false, Green: true }`. There should be at most one key with a true value, and this key represents the team who controls the region.

### Precomputed Tiles

A "region query" is a query that asks "I have this latitude and this longitude, which region am I in?". This query is performed every time a team's location updates.

In order to speed up region queries, the playing area has been divided into tiles of different sizes, and region queries have been precomputed for these tiles.

The different sizes are as follows:
- A "big tile" is a region between two parallels separated by 0.01° and two meridians separated by 0.01°
- A "medium tile" is between two parallels separated by 0.005° and two meridians separated by 0.005°
- A "small tile" is between two parallels separated by 0.001° and two meridians separated by 0.001°

Tiles are indexed based on the corresponding keys. These keys map { latitude, longitude} positions to a string. Tiles can be defined as the locus of all points with a given key:
- A "big key" is equal to the position's latitude and longitude floored to 2 decimal places and concatenated. So for example 52.1234°N, 4.5678°E would have a big key of 5212456. Angles are to be floored towards negative infinity, not rounded.
- A "small key" is similar to a big key but using 3 decimal places. So for example 52.1234°N, 4.5678°E would have a small key of 521234567.
- A "medium key" is similar to a small key, but the most precise digits of each angle are rounded down to the 5 below. In other words, if the 5th digit of latitude or 4th digit of longitude is a 0, 1, 2, 3 or 4 then it is represented by a 0 in the medium key, while if it is a 5, 6, 7, 8 or 9 then it is represented by a 5. So for example 52.1234°N, 4.5678°E would have a medium key of 521204565.

`big-tiles.json` contains a map from big keys to region names. A big tile is in this map iff it is located entirely within one region.

`medium-tiles.json` contains a map from medium keys to region names. A medium tile is in this map iff it is located entirely within one region but the big tile containing it is not entirely within one region.

`small-tiles.json` contains a map from small keys to region names. A small tile is in this map iff it is located entirely within one region but the medium tile containing it is not entirely within one region.

To process a region query, first calculate the big key of the position, and then look up the corresponding precomputed tile in big-tiles. If the key is included in big-tiles, then return the name of the corresponding region, since all positions in that big tile are located in that region.

If the big tile is not stored in big-tiles, calculate the medium key and do a similar lookup in medium-tiles. If that is also a miss, then do the same for small-tiles. If the key is not in any of the precomputed tile sets, then a more expensive polygon lookup should be performed.

### Bounding Boxes
`bounding-boxes.json` stores information about the northernmost, southernmost, easternmost and westernmost point in each region. This is stored as an object with region names as keys and `{ minLat, maxLat, minLon, maxLon }` objects to represent these boundaries. The boundaries should make all of the following conditions sufficient for the point being outside that region:
- `latitude < minLat`
- `latitude > maxLat`
- `longitude < minLon`
- `longitude > maxLon`

Bounding boxes are used for region queries involving points that do not match any of the precomputed results. The list of regions is pruned using the above criterion, and only the reduced list of candidates are checked using an expensive polygon calculation.