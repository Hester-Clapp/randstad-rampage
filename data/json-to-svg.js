const fs = require('fs');

const boundaries = JSON.parse(fs.readFileSync('boundaries.json', 'utf8'));

// lon 3–5 → x 0–2, lat 51–53 → y 0–2 (inverted, SVG y goes down)
const toSvg = ([lon, lat]) => [lon - 4, 52.5 - lat];

const paths = Object.entries(boundaries).map(([name, coords]) => {
    const points = coords.map(toSvg);
    const d = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + ' Z';
    return `  <path title="${name}" d="${d}" fill="none" stroke="black" stroke-width="0.002"/>`;
}).join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">
${paths}
</svg>`;

fs.writeFileSync('boundaries.svg', svg);
console.log('Written boundaries.svg');
