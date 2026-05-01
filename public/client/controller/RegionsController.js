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

    async showPosition(position) {
        const { latitude, longitude, accuracy, age } = position

        const res = await fetch(`/regionQuery?lat=${latitude}&lon=${longitude}`)
        console.log(res)
        const region = await res.json()
        console.log(region)
        const distance = this.geo.distance(position, region.position)
        
        document.querySelector("output#coords").textContent = `Lat: ${latitude}N, Lon: ${longitude}E, Accuracy: ${accuracy}, Age: ${age}`
        document.querySelector("output#region").textContent = region.name
        document.querySelector("output#distance").textContent = `${distance.lower}m and ${distance.upper}m`
    }
}
