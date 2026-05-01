import smallTile from '../../data/small-tiles.json' with { type: 'json' };
import { smallKey } from "../../public/utils/tile-keys.js"

export class SmallTile {

    get(position) {
        const key = smallKey(position)
        return smallTile[key]
    }
}