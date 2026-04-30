import { Controller } from './Controller.js';
import { loadPage } from './pageLoader.js';

import { GeoLocationService } from '../service/GeoLocationService.js';

export class RegionsController extends Controller {
    res

    async beforeLoad() {
        super.beforeLoad()
    }

    async afterLoad() {
        super.afterLoad()

        this.geo = new GeoLocationService()

        this.geo.addEventListener("move", (e) => this.showPosition(e.detail))
        this.showPosition(this.geo.position)
    }

    showPosition(position) {
        const { latitude, longitude, accuracy, age } = position
        document.querySelector("output#coords").innerHTML = `Lat: ${latitude}N, Lon: ${longitude}E, Accuracy: ${accuracy}, Age: ${age}`

        const denHaag = {
            "latitude": 52.07765536820172,
            "longitude": 4.308076480561379,
            "accuracy": 0
        }
        const distance = this.geo.distance(position, denHaag)

        document.querySelector("output#distance").innerHTML = `${distance.lower}m and ${distance.upper}m`
    }
}
