import boundaryTile from '../../data/boundary-tiles.json' with { type: 'json' };
import { smallKey } from "../../public/utils/tile-keys.js"

export class BoundaryTile {

    get(position) {
        const key = smallKey(position)
        return boundaryTile[key]
    }
}