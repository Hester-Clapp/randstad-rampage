import { Controller } from './Controller.js';
import { loadPage } from './pageLoader.js';

import { GeoLocationService } from '../service/GeoLocationService.js';
import { GeoLocationMock } from '../service/GeoLocationService.js';
import { DistanceCalculator } from '../service/DistanceCalculator.js';
import { MapHandler } from '../service/MapHandler.js';
import { UIFactory } from '../service/UIFactory.js';

import { whichRegionContains, getRegionStatus, claimRegion } from "../../utils/requests.js"

export class RegionsController extends Controller {
    async beforeLoad(teamName) {
        super.beforeLoad()
        
        this.dist = new DistanceCalculator()
        this.ui = new UIFactory()

        this.region = null
        this.teamName = teamName
        this.maxDistance = 100
    }

    async afterLoad() {
        super.afterLoad()

        // this.geo = new GeoLocationService()
        this.geo = new GeoLocationMock()
        this.map = new MapHandler()

        document.querySelector("button#claimButton").addEventListener("click", () => this.claim())
        document.querySelector("button#challengeButton").addEventListener("click", () => this.challenge())

        this.onMove(this.geo.position)
        this.geo.addEventListener("move", (e) => this.onMove(e.detail))
    }

    // Utils

    getDistance(region = this.region) {
        return region ? this.dist.distance(this.geo.position, region.position) : null
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

    async challenge(region = this.region) {
        if (!region || !region.name) throw new Error("Invalid region")
        if (!region.status) throw new Error("Unknown region status")
        if (region.status.challenged) throw new Error("Region already challenged")

        const { distance, accuracy } = this.getDistance()
        if (distance - accuracy > this.maxDistance) throw new Error("Region already challenged")
        
        await loadPage("challenge", this.region, this.teamName)
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

        const claimButton = document.querySelector("button#claimButton")
        const challengeButton = document.querySelector("button#challengeButton")
        
        if (region.status.claimed) {
            claimButton.disabled = true
            claimButton.classList.add("alreadyDone")
        }
        
        if (region.status.challenged) {
            challengeButton.disabled = true
            challengeButton.classList.remove("tooFar")
            challengeButton.classList.add("alreadyDone")
        } else {
            const { distance, accuracy } = this.getDistance()
            const closeEnough = distance - accuracy < this.maxDistance
            challengeButton.disabled = closeEnough
            challengeButton.classList.toggle("tooFar", closeEnough)
        }
    }

    showCurrentRegion() {
        if (!this.region) return
        
        this.ui.regionTitle(this.region, this.region.status.owner, document.querySelector("#region"))
        this.ui.buildingDistanceLabel(this.region, this.getDistance(), document.querySelector("#buildingDistance"))
    }
}
