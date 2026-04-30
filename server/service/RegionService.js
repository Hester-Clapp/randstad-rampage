import boundaries from '../../data/boundaries.json' with { type: 'json' };
import regions from '../../data/regions.json' with { type: 'json' };

export class RegionService {
    async getDistrict({ latitude, longitude }) {
        for (const [name, polygon] of Object.entries(boundaries)) {
            if (this.pointInPolygon(longitude, latitude, polygon)) {
                return name;
            }
        }
        return null;
    }

    async getRegion(position) {
        const currentDistrict = await this.getDistrict(position)
        for (const region of regions) {
            for (const district of region.districts) {
                if (district === currentDistrict) return region
            }
        }
    }

    // Ray casting algorithm — counts how many times a ray from the point
    // crosses the polygon boundary; odd = inside.
    pointInPolygon(x, y, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];
            const [dx, dy] = [xj - xi, yj - yi]
            const [cx, cy] = [x - xi, y - yi]
            if ((yi > y) !== (yj > y) && x < (dx * cx) / dy + xi) {
                inside = !inside;
            }
        }
        return inside;
    }
}