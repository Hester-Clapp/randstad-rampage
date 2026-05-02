import { Controller } from './Controller.js';
import { loadPage } from './pageLoader.js';

import { GeoLocationService } from '../service/GeoLocationService.js';
import { DistanceCalculator } from '../service/DistanceCalculator.js';
import { MapHandler } from '../service/MapHandler.js';

import { getColorNeutralBlack } from "../../utils/team-color.js"

export class RegionsController extends Controller {
    async beforeLoad() {
        super.beforeLoad()
        
        this.dist = new DistanceCalculator()

        this.region = null
        this.teamName = sessionStorage.getItem("teamName")
    }

    async afterLoad() {
        super.afterLoad()

        this.geo = new GeoLocationService()
        this.map = new MapHandler()

        document.querySelector("button#claimButton").addEventListener("click", () => this.claim())
        // document.querySelector("button#challengeButton").addEventListener("click", () => this.challenge())

        this.onMove(this.geo.position)
        this.geo.addEventListener("move", (e) => this.onMove(e.detail))
    }

    // Actions

    async claim(region = this.region) {
        if (!region || !region.name) throw new Error("Invalid region")
        if (!region.status) throw new Error("Unknown region status")
        if (region.status.claimed) throw new Error("Region already claimed")
    
        const res = await fetch(`/region/${this.region.name}/claim?teamName=${this.teamName}`, { method: "PUT" })
        if (!res.ok) throw new Error(await res.text())

        navigator.vibrate(50)
        await this.updateRegionStatus()
        this.showCurrentRegion()
    }

    // Reactions

    async onMove(position) {
        const { latitude, longitude } = position
        if (!latitude || !longitude) return

        this.region = await fetch(`/regionQuery?lat=${latitude}&lon=${longitude}`).then(res => res.json())
        if (!this.region) return

        await this.updateRegionStatus()
        this.showCurrentRegion()
    }

    async updateRegionStatus(region = this.region) {
        region.status = await fetch(`/region/${region.name}/status`)
            .then(res => res.ok ? res.json() : { owner: "Unknown", claimed: true, locked: true })

        this.map.setOwner(region.name, region.status.owner)

        if (region.status.claimed) {
            const claimButton = document.querySelector("button#claimButton")
            claimButton.disabled = true
            claimButton.classList.add("alreadyDone")
        }
    }

    showCurrentRegion() {
        if (!this.region) return
        
        const distance = this.dist.distance(this.geo.position, this.region.position)

        const owner = document.createElement("span")
        owner.textContent = this.region.status.owner
        owner.style.color = getColorNeutralBlack(this.region.status.owner)
        document.querySelector("#region").innerHTML = `${this.region.name} (${owner.outerHTML})`
        document.querySelector("#distance").textContent = this.dist.format(distance)
        document.querySelector("#building").textContent = this.region.building
    }
}
