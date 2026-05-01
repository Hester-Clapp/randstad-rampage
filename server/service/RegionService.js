import { DistrictQueryHandler } from "./DistrictQueryHandler.js"
import { RegionRepository } from "../database/RegionRepository.js"

export class RegionService {

    constructor(dqh, regions) {
        this.dqh = dqh;
        this.districts = dqh.districts;
        this.regions = regions;
    }

    static async create() {
        const dqh = new DistrictQueryHandler();
        const regions = await RegionRepository.create();
        return new RegionService(dqh, regions);
    }

    whichRegionContains(position) {
        const district = this.dqh.getDistrict(position)
        if (district === null) return null
        const name = this.districts.getRegion(district)
        return name
    }

    get(name) {
        return this.regions.get(name)
    }
    
    async getStatus(name) {
        return this.regions.getStatus(name)
    }

    async claim(regionName, teamName) {
        return this.regions.claim(regionName, teamName)
    }

    async challenge(regionName, teamName, success) {
        return this.regions.challenge(regionName, teamName, success)
    }

    async reset() {
        return this.regions.reset()
    }

}