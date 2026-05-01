import { DistrictRepository } from "../database/DistrictRepository.js"
import { BigTile } from "../database/BigTile.js"
import { SmallTile } from "../database/SmallTile.js"
import { BoundaryTile } from "../database/BoundaryTile.js"

export class DistrictQueryHandler {

    constructor(mockDistricts, mockBigTile, mockSmallTile, mockBoundaryTile) {
        this.districts = mockDistricts || new DistrictRepository()
        this.bigTile = mockBigTile || new BigTile()
        this.smallTile = mockSmallTile || new SmallTile()
        this.boundaryTile = mockBoundaryTile || new BoundaryTile()
    }

    getDistrict(position) {
        console.log(position)
        if (!position) throw new Error("Invalid position")
        if (!position.latitude) throw new Error("Invalid position, missing latitude")
        if (!position.longitude) throw new Error("Invalid position, missing longitude")
        if (typeof position.latitude === "string") position.latitude = Number(position.latitude)
        if (typeof position.longitude === "string") position.longitude = Number(position.longitude)

        const match = this.bigTile.get(position) || this.smallTile.get(position)
        console.log(match)
        if (match) return match

        // const candidates = this.boundaryTile.get(position)
        const candidates = this.districts.getCandidates(position)
        if (!candidates) return null // Position was not in any district

        for (const name of candidates) {
            const polygon = this.districts.get(name)
            if (this.pointInPolygon(position, polygon)) {
                return name
            }
        }

        return null // Position is close to the boundary but not inside
    }

    // Ray casting algorithm — counts how many times a ray from the point
    // crosses the polygon boundary; odd = inside.
    pointInPolygon({ latitude, longitude }, polygon) {
        const x = longitude
        const y = latitude
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];
            const [dx, dy] = [xj - xi, yj - yi]
            if ((yi > y) !== (yj > y) && x < (dx * (x - xi)) / dy + xi) {
                inside = !inside;
            }
        }
        return inside;
    }
}