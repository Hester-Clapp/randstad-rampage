import districts from '../../data/districts.json' with { type: 'json' };
import boundingBoxes from '../../data/bounding-boxes.json' with { type: 'json' };
import districtToRegion from '../../data/district-to-region.json' with { type: 'json' };

export class DistrictRepository {

    get(name) {
        return districts[name]
    }

    getRegion(name) {
        return districtToRegion[name]
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
}