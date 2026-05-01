#!/usr/bin/env node
// Reads regions.json, merges each region's districts into one polygon, and
// writes data/merged.json. Skips any region that contains a Rotterdam district.
// Run: node scripts/unite-polygons.js

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const THRESHOLD = 0.01;

function dist2(p1, p2) {
    const dx = p1[0] - p2[0], dy = p1[1] - p2[1];
    return dx * dx + dy * dy;
}

/**
 * Unite two polygons by removing their shared seam.
 * @param {number[][]} polyA - Array of [lon, lat] pairs (open or closed ring)
 * @param {number[][]} polyB - Array of [lon, lat] pairs (open or closed ring)
 * @param {number} threshold - Max distance for a point to be considered on the seam
 * @returns {number[][] | false} United polygon as open ring, or false if cannot merge
 */
export function unitePolygons(polyA, polyB, threshold = 0.01) {
    const thresh2 = threshold * threshold;

    // Remove closing point if polygon is explicitly closed
    const A = dist2(polyA[0], polyA.at(-1)) < 1e-20 ? polyA.slice(0, -1) : polyA.slice();
    const B = dist2(polyB[0], polyB.at(-1)) < 1e-20 ? polyB.slice(0, -1) : polyB.slice();
    const n = A.length, m = B.length;

    // For each point in A, find the nearest point in B within threshold
    const matchesA = new Map(); // index in A -> index in B
    for (let i = 0; i < n; i++) {
        let bestJ = -1, bestD2 = thresh2;
        for (let j = 0; j < m; j++) {
            const d2 = dist2(A[i], B[j]);
            if (d2 < bestD2) { bestD2 = d2; bestJ = j; }
        }
        if (bestJ !== -1) matchesA.set(i, bestJ);
    }

    if (matchesA.size === 0) return false;

    // Reverse lookup: index in B -> index in A
    const matchesB = new Map();
    for (const [ai, bi] of matchesA) matchesB.set(bi, ai);

    const seamSetA = new Set(matchesA.keys());

    // Find the seam's start and end in A, verifying it forms exactly one contiguous arc
    let seamStartA = -1, seamEndA = -1, seamStartCount = 0;
    for (let i = 0; i < n; i++) {
        if (!seamSetA.has(i)) continue;
        if (!seamSetA.has((i - 1 + n) % n)) { seamStartCount++; seamStartA = i; }
        if (!seamSetA.has((i + 1) % n))       seamEndA = i;
    }

    if (seamStartCount !== 1) return false; // disconnected seam or entire polygon is seam

    const bAtStart = matchesA.get(seamStartA); // B index matching A's seam start
    const bAtEnd   = matchesA.get(seamEndA);   // B index matching A's seam end

    // Detect whether B traverses the seam in the same (+1) or opposite (-1) direction as A.
    // For adjacent CCW polygons, B always reverses the seam.
    let bDir = -1;
    if (matchesA.size > 1) {
        const secondA = (seamStartA + 1) % n;
        if (seamSetA.has(secondA)) {
            bDir = (matchesA.get(secondA) - bAtStart + m) % m === 1 ? 1 : -1;
        }
    }

    // Outer (non-seam) arc of B runs from just past one seam junction to the other
    const bOuterStart = bDir === -1 ? (bAtStart + 1) % m : (bAtEnd + 1) % m;
    const bOuterEnd   = bDir === -1 ? bAtEnd             : bAtStart;

    // Blend two matched junction points into one
    function blend(p1, p2) {
        return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    }

    const result = [];

    // Walk outer arc of A: non-seam points from (seamEndA+1) to seamStartA (inclusive).
    // seamStartA is a seam junction — blend it with its B counterpart.
    for (let i = (seamEndA + 1) % n; ; i = (i + 1) % n) {
        result.push(i === seamStartA ? blend(A[i], B[bAtStart]) : A[i]);
        if (i === seamStartA) break;
    }

    // Walk outer arc of B: non-seam points from bOuterStart to bOuterEnd (inclusive).
    // bOuterEnd is a seam junction — blend it with its A counterpart.
    for (let j = bOuterStart; ; j = (j + 1) % m) {
        result.push(j === bOuterEnd ? blend(A[matchesB.get(j)], B[j]) : B[j]);
        if (j === bOuterEnd) break;
    }

    return result;
}

const allDistricts = JSON.parse(readFileSync(join(__dirname, '../data/all-districts.json'), 'utf8'));
const regions = JSON.parse(readFileSync(join(__dirname, '../data/regions.json'), 'utf8'));

const output = { ...allDistricts };

for (const region of regions) {

    const hasRotterdam = region.districts.some(d => d.startsWith('Rotterdam -'));
    if (hasRotterdam) {
        console.log(`Skipping "${region.name}" (contains Rotterdam district)`);
        continue;
    }

    const available = region.districts.filter(d => {
        if (!allDistricts[d]) { console.warn(`  Warning: district "${d}" not found, skipping`); return false; }
        return true;
    });

    if (available.length === 0) {
        console.warn(`Skipping "${region.name}": no available districts`);
        continue;
    }

    // Greedily merge districts in any order by always picking the next one that shares a seam
    let merged = allDistricts[available[0]];
    const remaining = available.slice(1);

    while (remaining.length > 0) {
        let merged_one = false;
        for (let i = 0; i < remaining.length; i++) {
            const candidate = allDistricts[remaining[i]];
            const result = unitePolygons(merged, candidate, THRESHOLD)
                        || unitePolygons(candidate, merged, THRESHOLD);
            if (result !== false) {
                merged = result;
                remaining.splice(i, 1);
                merged_one = true;
                break;
            }
        }
        if (!merged_one) {
            console.error(`Cannot merge remaining districts for "${region.name}": ${remaining.join(', ')}`);
            process.exit(1);
        }
    }

    for (const d of available) delete output[d];
    output[region.name] = merged;
    console.log(`Merged "${region.name}" from: ${available.join(', ')}`);
}

const outPath = join(__dirname, '../data/districts.json');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(output, null, 4));
console.log(`\nWritten to ${outPath}`);
