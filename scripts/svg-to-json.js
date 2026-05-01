const fs = require('fs');

const html = fs.readFileSync('rotterdam.html', 'utf8');

let max_x, min_x, max_y, min_y

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
        // const lon = transform(x, 1220, 596, 0.31) + 3
        // const lat = 53 - transform(y, 515, 604, 0.08)

        // if (!max_x || x > max_x) max_x = x
        // if (!min_x || x < min_x) min_x = x
        // if (!max_y || y > max_y) max_y = y
        // if (!min_y || y < min_y) min_y = y

        transformed.push([transformX(x), transformY(y)])
    }
    return transformed
}

function transformX(x) {
    const min_x = 191.741
    const max_x = 1216.2999999999997
    const min_lon = 4.071217927850176
    const max_lon = 4.6019807833254776

    const x_height = max_x - min_x
    const lon_height = max_lon - min_lon

    const relative = (x - min_x) / x_height
    return relative * lon_height + min_lon
}

function transformY(y) {
    const min_y = 40.252
    const max_y = 513.4960000000001
    const min_lat = 51.8423026721512
    const max_lat = 51.99427425109035

    const y_height = max_y - min_y
    const lat_height = max_lat - min_lat

    const relative = (y - min_y) / y_height
    return max_lat - relative * lat_height
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

console.log(`x from ${min_x} to ${max_x}, y from ${min_y} to ${max_y}`)