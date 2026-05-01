import { describe, it, expect, beforeEach } from 'bun:test';
import { DistrictQueryHandler } from './DistrictQueryHandler.js';

function run(handler, latitude, longitude) {
    return handler.getDistrict({ latitude, longitude })
}

const districts = {
    Delft: [
        [4.3535, 52.0165],
        [4.3535, 51],
        [4, 51],
        [4, 52.0165],
    ],
    Rijswijk: [
        [4.3515, 52.0165],
        [4.3515, 53],
        [4, 53],
        [4, 52.0165],
    ]
}

const bigTiles = {
    "5200435": "Delft"
}

const smallTiles = {
    "520104350": "Delft",
    "520114350": "Delft",
    "520124350": "Delft",
    "520134350": "Delft",
    "520144350": "Delft",
    "520154350": "Delft",
    "520174350": "Rijswijk",
    "520184350": "Rijswijk",
    "520184350": "Rijswijk",
}
const boundaryTiles = {
    "520164350": ["Delft", "Rijswijk"],
    "520164353": ["Delft"],
}

describe('DistrictQueryHandler', () => {
    let handler;

    beforeEach(() => {
        handler = new DistrictQueryHandler(districts, bigTiles, smallTiles, boundaryTiles);
    });

    it("should throw an error if position is the wrong shape", () => {
        expect(() => handler.getDistrict(null)).toThrow("Invalid position")
        expect(() => handler.getDistrict({ longitude: 4.5 })).toThrow("Invalid position, missing latitude")
        expect(() => handler.getDistrict({ latitude: 52 })).toThrow("Invalid position, missing longitude")
        expect(() => handler.getDistrict({ latitude: 52, longitude: null })).toThrow("Invalid position, missing longitude")
    })

    it("should return null for positions outside the play area", () => {
        expect(run(handler, 50, 4)).toBe(null)
    })

    it("should match points in big tiles", () => {
        expect(run(handler, 52, 4.35)).toBe("Delft")
    })

    it("should match points in small tiles", () => {
        expect(run(handler, 52.013, 4.35)).toBe("Delft")
        expect(run(handler, 52.018, 4.35)).toBe("Rijswijk")
    })

    it("should match points in boundary tiles", () => {
        expect(run(handler, 52.0162, 4.35)).toBe("Delft")
        expect(run(handler, 52.0168, 4.35)).toBe("Rijswijk")
    })

    it("should return null for points in boundary tiles outside the region", () => {
        expect(run(handler, 52.0162, 4.3538)).toBe(null)
    })

    /*
    position: null, wrong shape, outside playing area, in no district, in one district
    boundaries: in a big tile, in a small tile, in a boundary tile and inside, in a boundary tile and outside, not in any tile

    tests:
    null
    missing latitude
    missing longitude
    outside play area
    in a big tile
    in a small tile
    in a boundary tile, in the district
    in a boundary tile, not in the district
    not in any district
    */

    it('pointInPolygon returns true for a point inside a simple square polygon', () => {
        const square = [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
        ];
        const inside = handler.pointInPolygon({ longitude: 0.5, latitude: 0.5 }, square);
        expect(inside).toBe(true);
    });
});
