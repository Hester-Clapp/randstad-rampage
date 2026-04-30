const fs = require('fs');

const html = fs.readFileSync('rotterdam.html', 'utf8');

function tokenize(d) {
    const tokens = [];
    const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/g;
    let m;
    while ((m = re.exec(d)) !== null) {
        if (m[1]) tokens.push({ type: 'cmd', val: m[1] });
        else tokens.push({ type: 'num', val: parseFloat(m[2]) });
    }
    return tokens;
}

function parsePath(d) {
    const tokens = tokenize(d);
    const points = [];
    let i = 0;
    let cx = 0, cy = 0;
    let startX = 0, startY = 0;

    const num = () => tokens[i++].val;
    const hasNum = () => i < tokens.length && tokens[i].type === 'num';

    while (i < tokens.length) {
        if (tokens[i].type !== 'cmd') { i++; continue; }
        const cmd = tokens[i++].val;

        switch (cmd) {
            case 'M':
                cx = num(); cy = num();
                startX = cx; startY = cy;
                points.push([cx, cy]);
                while (hasNum()) { cx = num(); cy = num(); points.push([cx, cy]); }
                break;
            case 'm':
                cx += num(); cy += num();
                startX = cx; startY = cy;
                points.push([cx, cy]);
                while (hasNum()) { cx += num(); cy += num(); points.push([cx, cy]); }
                break;
            case 'L':
                while (hasNum()) { cx = num(); cy = num(); points.push([cx, cy]); }
                break;
            case 'l':
                while (hasNum()) { cx += num(); cy += num(); points.push([cx, cy]); }
                break;
            case 'H':
                while (hasNum()) { cx = num(); points.push([cx, cy]); }
                break;
            case 'h':
                while (hasNum()) { cx += num(); points.push([cx, cy]); }
                break;
            case 'V':
                while (hasNum()) { cy = num(); points.push([cx, cy]); }
                break;
            case 'v':
                while (hasNum()) { cy += num(); points.push([cx, cy]); }
                break;
            case 'C':
                while (hasNum()) { num(); num(); num(); num(); cx = num(); cy = num(); points.push([cx, cy]); }
                break;
            case 'c':
                while (hasNum()) { num(); num(); num(); num(); cx += num(); cy += num(); points.push([cx, cy]); }
                break;
            case 'S':
                while (hasNum()) { num(); num(); cx = num(); cy = num(); points.push([cx, cy]); }
                break;
            case 's':
                while (hasNum()) { num(); num(); cx += num(); cy += num(); points.push([cx, cy]); }
                break;
            case 'Q':
                while (hasNum()) { num(); num(); cx = num(); cy = num(); points.push([cx, cy]); }
                break;
            case 'q':
                while (hasNum()) { num(); num(); cx += num(); cy += num(); points.push([cx, cy]); }
                break;
            case 'T':
                while (hasNum()) { cx = num(); cy = num(); points.push([cx, cy]); }
                break;
            case 't':
                while (hasNum()) { cx += num(); cy += num(); points.push([cx, cy]); }
                break;
            case 'Z': case 'z':
                cx = startX; cy = startY;
                break;
        }
    }

    return points;
}

function transformPath(path) {
    const transformed = []
    for (const [x, y] of path) {
        const lon = transform(x, 1220, 596, 0.31) + 3
        const lat = 53 - transform(y, 515, 604, 0.08)

        transformed.push([lat, lon])
    }
    return transformed
}

function transform(point, rotterdamSvgWidth, translate, scale) {
    const boundariesSvgWidth = 2
    const boundariesSvgWidthPx = 1211.33

    const relative = point / rotterdamSvgWidth
    const px = relative * boundariesSvgWidthPx
    const transformedPx = (px - translate) * scale + translate
    const transformedRelative = transformedPx / boundariesSvgWidthPx
    return transformedRelative * boundariesSvgWidth
}

const result = {};
const pathRe = /<path\b([\s\S]*?)(?:\/>|>)/g;

for (const [, attrs] of html.matchAll(pathRe)) {
    const titleMatch = attrs.match(/title="([^"]+)"/);
    if (!titleMatch) continue;
    const name = titleMatch[1].replace(/^Naar\s+/, '');

    const dMatch = attrs.match(/\bd="([\s\S]*?)"/);
    if (!dMatch) continue;

    result[`Rotterdam - ${name}`] = transformPath(parsePath(dMatch[1]));
}

fs.writeFileSync('rotterdam.json', JSON.stringify(result, null, 4));
console.log('Written rotterdam.json with', Object.keys(result).length, 'districts:',
    Object.keys(result).join(', '));
