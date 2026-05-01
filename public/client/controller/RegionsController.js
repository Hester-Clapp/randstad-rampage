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

        if (!latitude || !longitude) return

        const region = await fetch(`/regionQuery?lat=${latitude}&lon=${longitude}`).then(res => res.json())
        const status = await fetch(`/region/${region.name}/status`).then(res => res.json()) || "Unclaimed"
        const distance = this.geo.distance(position, region.position)
        
        document.querySelector("output#coords").textContent = `Lat: ${latitude}N, Lon: ${longitude}E, Accuracy: ${accuracy}, Age: ${age}`
        document.querySelector("output#region").textContent = `${region.name} (${status})`
        document.querySelector("output#distance").textContent = `${distance.lower}m and ${distance.upper}m`
        document.querySelector("output#building").textContent = region.building
    }
}
