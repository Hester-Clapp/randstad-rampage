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
        return this.regions.get(name)
    }
    
    getPolygon(region) {
        const reverseLatLon = polygon => polygon.map(([lon, lat]) => [lat, lon])
        
        const polygon = this.polygons.get(region.name)
        return { ...region, polygon: reverseLatLon(polygon) }
    }

    async getMapData() {
        return this.regions.getAllRegions()
            .map(region => this.getPolygon(region))
    }

    async getScores() {
        const regions = await this.getAllStatuses()
        const scores = {}

        for (const region of regions) {
            const { owner, claimed, locked } = region.status
            if (!claimed) continue
            if (owner === "Neutral") continue
            scores[owner] ??= { claimed: 0, locked: 0 }
            scores[owner].claimed++
            if (locked) scores[owner].locked++
        }
        return scores
    }

    async getStatus(regionName) {
        const status = await this.regions.getStatus(regionName)
        return (status.claimed) ? status : { ...status, owner: "Neutral"}
    }

    async getAllStatuses() {
        const regions = this.regions.getAllRegions()
        const statuses = await Promise.all(regions.map(async r => {
            return {...r, status: await this.getStatus(r.name)}
        }))
        return statuses
    }

    async claim(regionName, teamName) {
        await this.regions.claim(regionName, teamName)
    }

    async challenge(regionName, teamName, success) {
        await this.regions.challenge(regionName, teamName, success)
    }

    async reset() {
        await this.regions.reset()
        await this.regions.claim("Delft", "Neutral")
    }

}