### General
The "playing area" is defined as the region between the 4.1°E and 4.7°E meridians and between the 51.8°N and 52.2°N parallels.

A "district" is an area in real life such as a gemeente or a stadsdeel. Districts have boundaries which are published and have been downloaded.

A "region" is an area in the game which can be claimed, has a point of interest and a challenge that must be completed there. The area of a region is defined as the union of the areas enclosed by several districts.

### Precomputed Tiles
A "big tile" is a region between two parallels separated by 0.01° and two meridians separated by 0.01°.

A "big key" is equal to the first 4 digits of a position's latitude and the first 3 digits of the position's longitude concatenated. So for example 52.1234°N, 4.5678°E would have a big key of 5212456. Angles are to be floored towards negative infinity, not rounded.

`big-tiles.json` contains a map from big keys to districts. A big tile is in this map iff it is located entirely within one district and it maps to the name of that district.

A "small tile" is a region between two parallels separated by 0.001° and two meridians separated by 0.001°.

A "small key" is equal to the first 5 digits of a position's latitude and the first 4 digits of the position's longitude concatenated. So for example 52.1234°N, 4.5678°E would have a big key of 521234567. Angles are to be floored towards negative infinity, not rounded.

`small-tiles.json` contains a map from small keys to districts. A small tile is in this map iff it is located entirely within one district and it maps to the name of that district.

`boundary-tiles.json` contains a map from small keys to arrays of districts. A small tile is in this map iff there is a district which has a boundary that passes through the tile. The value it maps to is an array of district names, which is a superset of the set of districts that intersect the tile. If a position is located in a boundary tile, then it is contained within (at least) one of the districts in the array, or is not in any district. Contrapositively, if a district is not in the array, then it is impossible for a position in the boundary tile to be in that district.

If a position's big tile is not in `big-tiles.json` and its small tile is not in `small-tiles.json` or in `boundary-tiles.json`, then it is not contained in any district.
