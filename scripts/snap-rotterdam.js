import districts from '../data/all-districts.json' with { type: 'json' };
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';


const tolerance = 0.0001

const rotterdamPoints = new Set()
const nonRotterdamPoints = new Set()
const rotterdam = {}
const blendedRotterdam = {}
const output = {}

for (const [name, poly] of Object.entries(districts)) {
    if (name.startsWith("Rotterdam - ")) {
        for (const point of poly) {
            rotterdamPoints.add(point)
        }
        rotterdam[name] = poly
    } else {
        for (const point of poly) {
            nonRotterdamPoints.add(point)
        }
        // output[name] = poly
    }
}

function distance([x1, y1], [x2, y2]) {
    const sec52 = 1.624269246
    return (x2 - x1) ** 2 + ((y2 - y1) * sec52) ** 2
}

// for (const [name, poly] of Object.entries(rotterdam)) {
//     const blended = []
//     for (const point of poly) {
//         let nearest = [0, 0]
//         for (const other of rotterdamPoints) {
//             if (distance(point, other) < distance(point, nearest)
//                 &&(point[0] !== other[0] || point[1] !== other[1])
//             ){
//             nearest = other
//             }
//         }

        
//         // if (distance(point, nearest) < tolerance) {
//             const blend = [(point[0] + nearest[0]) / 2, (point[1] + nearest[1]) / 2]
//             blended.push(blend)
//         // } else {
//             // blended.push(point)
//         // }
//     }
//     rotterdam[name] = blended
// }

let count = 0
for (const [name, poly] of Object.entries(rotterdam)) {
    const snapped = []
    for (const point of poly) {
        let nearest = [0, 0]
        for (const other of nonRotterdamPoints) {
            if (distance(point, other) < distance(point, nearest)
                &&(point[0] !== other[0] || point[1] !== other[1])
            ) {
                nearest = other
            }
        }

        if (distance(point, nearest) < tolerance) {
            count++
            const prev = snapped[snapped.length - 1] || [undefined, undefined]
            if (prev[0] !== nearest[0] || prev[1] !== nearest[1]) snapped.push(nearest)
        } else {
            snapped.push(point)
        }
    }
    output[name] = snapped
}

const outPath = join(__dirname, '../data/snapped.json');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(output, null, 4));
console.log(`\nWritten to ${outPath} (snapped ${count} points)`);
