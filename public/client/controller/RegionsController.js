import { Controller } from './Controller.js';
import { loadPage } from './pageLoader.js';

import { GeoLocationService } from '../service/GeoLocationService.js';
import { GeoLocationMock } from '../service/GeoLocationService.js';
import { DistanceCalculator } from '../service/DistanceCalculator.js';
import { MapHandler } from '../service/MapHandler.js';
import { UIFactory } from '../service/UIFactory.js';

import { whichRegionContains, getRegionStatus, claimRegion } from "../../utils/requests.js"

export class RegionsController extends Controller {
    async beforeLoad() {
        super.beforeLoad()
        
        this.dist = new DistanceCalculator()
        this.ui = new UIFactory()

        this.region = null
        this.teamName = sessionStorage.getItem("teamName")
    }

    async afterLoad() {
        super.afterLoad()

        // this.geo = new GeoLocationService()
        this.geo = new GeoLocationMock()
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

        await claimRegion(this.region, this.teamName)
    
        navigator.vibrate(50)
        await this.updateRegionStatus()
        this.showCurrentRegion()
    }

    // Reactions

    async onMove(position) {
        const { latitude, longitude } = position
        if (!latitude || !longitude) return

        this.region = await whichRegionContains(position)
        if (!this.region) return

        await this.updateRegionStatus()
        this.showCurrentRegion()
    }

    async updateRegionStatus(region = this.region) {
        region.status = await getRegionStatus(region)

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

        this.ui.regionTitle(this.region, this.region.status.owner, document.querySelector("#region"))
        this.ui.buildingDistanceLabel(this.region, distance, document.querySelector("#buildingDistance"))
    }
}
