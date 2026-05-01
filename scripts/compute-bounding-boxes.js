const fs = require('fs');
const path = require('path');

const districts = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/districts.json'), 'utf8'));

const boundingBoxes = {};

for (const [name, coords] of Object.entries(districts)) {
    let minLon = Infinity, maxLon = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    for (const [lon, lat] of coords) {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
    }

    boundingBoxes[name] = { minLon, minLat, maxLon, maxLat };
}

fs.writeFileSync(
    path.join(__dirname, '../data/bounding-boxes.json'),
    JSON.stringify(boundingBoxes, null, 4)
);

console.log(`Computed bounding boxes for ${Object.keys(boundingBoxes).length} districts.`);
