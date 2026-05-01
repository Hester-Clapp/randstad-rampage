import regions from '../../data/regions.json' with { type: 'json' };
import { DistrictQueryHandler } from "./DistrictQueryHandler.js"

export class RegionService {

    constructor() {
        this.dqh = new DistrictQueryHandler()
        this.districts = this.dqh.districts
    }

    whichRegionContains(position) {
        const district = this.dqh.getDistrict(position)
        if (district === null) return null
        const name = this.districts.getRegion(district)
        return name
    }

    getRegionData(name) {
        if (!name) return null

        const candidates = regions.filter(region => region.name === name)
        if (candidates.length > 0) return candidates[0]
        return null
    }
}