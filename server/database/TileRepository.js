import bigTile from '../../data/big-tiles.json' with { type: 'json' };
import mediumTile from '../../data/medium-tiles.json' with { type: 'json' };
import smallTile from '../../data/small-tiles.json' with { type: 'json' };

import { bigKey } from "../../public/utils/tile-keys.js"
import { mediumKey } from "../../public/utils/tile-keys.js"
import { smallKey } from "../../public/utils/tile-keys.js"

export class TileRepository {

    get(position) {
        return this.getBigTile(position)
            || this.getMediumTile(position)
            || this.getSmallTile(position)
            || null
    }

    getBigTile(position) {
        return bigTile[bigKey(position)]
    }

    getMediumTile(position) {
        return mediumTile[mediumKey(position)]
    }

    getSmallTile(position) {
        return smallTile[smallKey(position)]
    }
}