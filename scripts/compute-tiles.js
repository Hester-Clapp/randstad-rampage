const fs = require('fs');
const path = require('path');
import {bigKey, mediumKey, smallKey} from "../public/utils/tile-keys.js"

const districts = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/polygons.json'), 'utf8'));
const boundingBoxes = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/bounding-boxes.json'), 'utf8'));

const LON_MIN = 4.1, LON_MAX = 4.7;
const LAT_MIN = 51.8, LAT_MAX = 52.2;

const BIG_STEP = 0.01;
const BIG_COLS = Math.round((LON_MAX - LON_MIN) / BIG_STEP);
const BIG_ROWS = Math.round((LAT_MAX - LAT_MIN) / BIG_STEP);

const MEDIUM_STEP = 0.005;
const MEDIUM_COLS = Math.round((LON_MAX - LON_MIN) / MEDIUM_STEP);
const MEDIUM_ROWS = Math.round((LAT_MAX - LAT_MIN) / MEDIUM_STEP);

const SMALL_STEP = 0.001;
const SMALL_COLS = Math.round((LON_MAX - LON_MIN) / SMALL_STEP);
const SMALL_ROWS = Math.round((LAT_MAX - LAT_MIN) / SMALL_STEP);

// Ray casting point-in-polygon. polygon is array of [lon, lat] pairs.
function pointInPolygon(lon, lat, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        const dy = yj - yi;
        if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / dy + xi) {
            inside = !inside;
        }
    }
    return inside;
}

function getDistrict(lon, lat) {
    for (const [name, bounds] of Object.entries(boundingBoxes)) {
        if (lat < bounds.minLat || lat > bounds.maxLat) continue;
        if (lon < bounds.minLon || lon > bounds.maxLon) continue;
        if (pointInPolygon(lon, lat, districts[name])) return name;
    }
    return null;
}

function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    const d1x = bx - ax, d1y = by - ay;
    const d2x = dx - cx, d2y = dy - cy;
    const denom = d1x * d2y - d1y * d2x;
    if (denom === 0) return false;
    const t = ((cx - ax) * d2y - (cy - ay) * d2x) / denom;
    const u = ((cx - ax) * d1y - (cy - ay) * d1x) / denom;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

// Exact polygon–rectangle intersection: no false negatives.
function getDistrictsInTile(minLon, minLat, step) {
    const maxLon = minLon + step;
    const maxLat = minLat + step;
    const tileCorners = [
        [minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat],
    ];
    const tileEdges = [
        [minLon, minLat, maxLon, minLat],
        [maxLon, minLat, maxLon, maxLat],
        [maxLon, maxLat, minLon, maxLat],
        [minLon, maxLat, minLon, minLat],
    ];
    const found = [];

    for (const [name, bounds] of Object.entries(boundingBoxes)) {
        if (bounds.maxLon < minLon || bounds.minLon > maxLon) continue;
        if (bounds.maxLat < minLat || bounds.minLat > maxLat) continue;

        const polygon = districts[name];
        let overlaps = false;

        // 1. Any polygon vertex inside tile?
        for (const [vLon, vLat] of polygon) {
            if (vLon >= minLon && vLon <= maxLon && vLat >= minLat && vLat <= maxLat) {
                overlaps = true; break;
            }
        }

        // 2. Any tile corner inside polygon?
        if (!overlaps) {
            for (const [cLon, cLat] of tileCorners) {
                if (pointInPolygon(cLon, cLat, polygon)) { overlaps = true; break; }
            }
        }

        // 3. Any polygon edge crosses any tile edge?
        if (!overlaps) {
            outer: for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                const [ax, ay] = polygon[i];
                const [bx, by] = polygon[j];
                for (const [cx, cy, dx, dy] of tileEdges) {
                    if (segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy)) {
                        overlaps = true; break outer;
                    }
                }
            }
        }

        if (overlaps) found.push(name);
    }
    return found;
}

function tileHasBoundary(lon, lat, step) {
    const overlapping = getDistrictsInTile(lon, lat, step);
    if (overlapping.length > 1) return true;
    if (overlapping.length === 0) return false;
    const polygon = districts[overlapping[0]];
    return [[lon, lat], [lon + step, lat], [lon + step, lat + step], [lon, lat + step]]
        .some(([cLon, cLat]) => !pointInPolygon(cLon, cLat, polygon));
}

const bigTiles = {};
const mediumTiles = {};
const smallTiles = {};
// const boundaryTiles = {};

// Big tiles
for (let col = 0; col < BIG_COLS; col++) {
    for (let row = 0; row < BIG_ROWS; row++) {
        const lon = Math.floor((LON_MIN + col * BIG_STEP) * 100) / 100;
        const lat = Math.floor((LAT_MIN + row * BIG_STEP) * 100) / 100;

        if (!tileHasBoundary(lon, lat, BIG_STEP)) {
            const district = getDistrict(lon, lat);
            if (district !== null) bigTiles[bigKey({longitude: lon, latitude: lat})] = district
        }
    }
}

// Medium tiles
for (let col = 0; col < MEDIUM_COLS; col++) {
    for (let row = 0; row < MEDIUM_ROWS; row++) {
        const lon = Math.floor((LON_MIN + col * MEDIUM_STEP) * 100) / 100;
        const lat = Math.floor((LAT_MIN + row * MEDIUM_STEP) * 100) / 100;

        if (bigKey({longitude: lon, latitude: lat}) in bigTiles) continue

        if (!tileHasBoundary(lon, lat, MEDIUM_STEP)) {
            const district = getDistrict(lon, lat);
            if (district !== null) mediumTiles[mediumKey({longitude: lon, latitude: lat})] = district
        }
    }
}

// Small tiles
for (let col = 0; col < SMALL_COLS; col++) {
    for (let row = 0; row < SMALL_ROWS; row++) {
        const lon = Math.floor((LON_MIN + col * SMALL_STEP) * 100) / 100;
        const lat = Math.floor((LAT_MIN + row * SMALL_STEP) * 100) / 100;

        if (bigKey({longitude: lon, latitude: lat}) in bigTiles) continue
        if (mediumKey({longitude: lon, latitude: lat}) in mediumTiles) continue

        if (!tileHasBoundary(lon, lat, SMALL_STEP)) {
            const district = getDistrict(lon, lat);
            if (district !== null) smallTiles[smallKey({longitude: lon, latitude: lat})] = district
        }
    }
}

fs.writeFileSync(path.join(__dirname, '../data/big-tiles.json'), JSON.stringify(bigTiles));
fs.writeFileSync(path.join(__dirname, '../data/medium-tiles.json'), JSON.stringify(mediumTiles));
fs.writeFileSync(path.join(__dirname, '../data/small-tiles.json'), JSON.stringify(smallTiles));
// fs.writeFileSync(path.join(__dirname, '../data/boundary-tiles.json'), JSON.stringify(boundaryTiles));

console.log(`Big tiles (no boundary):   ${Object.keys(bigTiles).length}`);
console.log(`Medium tiles (no boundary):   ${Object.keys(mediumTiles).length}`);
console.log(`Small tiles (no boundary): ${Object.keys(smallTiles).length}`);
// console.log(`Boundary tiles:            ${Object.keys(boundaryTiles).length}`);
