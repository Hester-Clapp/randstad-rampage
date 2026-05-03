import { RegionRepository } from "../database/RegionRepository.js"
import { PolygonRepository } from "../database/PolygonRepository.js"
import { TileRepository } from "../database/TileRepository.js"

export class RegionService {

    constructor(regions) {
        if (!regions) throw new Error("Tried to initialise RegionService with no RegionRepository")
        this.regions = regions
        this.polygons = new PolygonRepository()
        this.tiles = new TileRepository()
    }

    static async create() {
        const regions = await RegionRepository.create();
        return new RegionService(regions);
    }

    whichRegionContains(position) {
        if (!position) throw new Error("Invalid position")
        if (!position.latitude) throw new Error("Invalid position, missing latitude")
        if (!position.longitude) throw new Error("Invalid position, missing longitude")
        if (typeof position.latitude === "string") position.latitude = Number(position.latitude)
        if (typeof position.longitude === "string") position.longitude = Number(position.longitude)

        const tileMatch = this.tiles.get(position)
        if (tileMatch) return tileMatch

        const candidates = this.polygons.getCandidates(position)
        if (!candidates) return null // Position was not in any region's bounding box

        for (const name of candidates) {
            if (this.polygons.positionInRegion(position, name)) {
                return name
            }
        }

        return null // Position is close to the boundary but not inside
    }

    isValid(name) {
        if (!name) return false
        return this.regions.contains(name)
    }

    get(name) {
        const region = this.regions.get(name)
        if (region.name === "Delft") {
            region.challenge = "Challenge description."
            region.time = 0.1
        }
        return region
    }
    
    getPolygon(region) {
        const reverseLatLon = polygon => polygon.map(([lon, lat]) => [lat, lon])
        
        const polygon = this.polygons.get(region.name)
        return { ...region, polygon: reverseLatLon(polygon) }
    }

    getAllPolygons() {
        const regions = this.regions.getAllRegions()
        return regions.map(region => this.getPolygon(region))
    }

    async getStatus(regionName) {
        const status = await this.regions.getStatus(regionName)
        return (status.claimed) ? status : { ...status, owner: "Neutral"}
    }

    async claim(regionName, teamName) {
        return await this.regions.claim(regionName, teamName)
    }

    async challenge(regionName, teamName, success) {
        return await this.regions.challenge(regionName, teamName, success)
    }

    async reset() {
        return await this.regions.reset()
    }

}