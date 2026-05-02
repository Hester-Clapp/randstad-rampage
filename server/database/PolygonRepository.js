import polygons from '../../data/polygons.json' with { type: 'json' };
import boundingBoxes from '../../data/bounding-boxes.json' with { type: 'json' };

export class PolygonRepository {

    get(name) {
        return polygons[name]
    }

    getCandidates({latitude, longitude, accuracy = 0}) {
        const candidates = []
        for (const [name, bounds] of Object.entries(boundingBoxes)) {
            if (latitude + accuracy < bounds.minLat) continue
            if (latitude - accuracy > bounds.maxLat) continue
            if (longitude + accuracy < bounds.minLon) continue
            if (longitude - accuracy > bounds.maxLon) continue
            candidates.push(name)
        }
        return candidates
    }

    positionInRegion(position, name) {
        return this.positionInPolygon(position, this.get(name))
    }

    positionInPolygon({latitude, longitude}, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];
            const dy = yj - yi;
            if ((yi > latitude) !== (yj > latitude) 
                && longitude < (xj - xi) * (latitude - yi) / dy + xi) {
                inside = !inside;
            }
        }
        return inside;
    }
}