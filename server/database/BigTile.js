import bigTile from '../../data/big-tiles.json' with { type: 'json' };
import { bigKey } from "../../public/utils/tile-keys.js"

export class BigTile {

    get(position) {
        const key = bigKey(position)
        return bigTile[key]
    }
}