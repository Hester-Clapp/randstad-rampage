import { Controller } from './Controller.js';
import { loadPage } from './pageLoader.js';

import { GeoLocationService } from '../service/GeoLocationService.js';
import { GeoLocationMock } from '../service/GeoLocationService.js';
import { DistanceCalculator } from '../service/DistanceCalculator.js';
import { MapHandler } from '../service/MapHandler.js';
import { UIFactory } from '../service/UIFactory.js';

import { whichRegionContains, getRegionStatus, claimRegion } from "../../utils/requests.js"

export class RegionsController extends Controller {
    constructor() {
        super()

        this.dist = new DistanceCalculator()
        this.ui = new UIFactory()
        this.geo = new GeoLocationService()
        // this.geo = new GeoLocationMock()
        this.map = new MapHandler()

    }

    async beforeLoad(teamName) {
        super.beforeLoad()
        
        this.region = null
        this.teamName = teamName
        this.maxDistance = 100
    }

    async afterLoad() {
        super.afterLoad()

        this.ui.header("regions", this.teamName, document.querySelector("header"))

        document.querySelector("button#claimButton").addEventListener("click", (e) => this.claim(this.region, e), { signal: this.cleanup.signal })
        document.querySelector("button#challengeButton").addEventListener("click", (e) => this.challenge(this.region, e), { signal: this.cleanup.signal })

        this.map.populate(this.geo.position)
        
        this.onMove(this.geo.position)
        this.geo.addEventListener("move", (e) => this.onMove(e.detail), { signal: this.cleanup.signal })
    }

    // Utils

    getDistance(region = this.region) {
        return region ? this.dist.distance(this.geo.position, region.position) : null
    }

    // Actions

    async claim(region = this.region, event) {
        if (!region || !region.name) throw new Error("Invalid region")
        if (!region.status) throw new Error("Unknown region status")
        if (region.status.claimed) this.showError("Region already claimed", event)

        await claimRegion(this.region, this.teamName)
    
        navigator.vibrate(50)
        await this.updateRegionStatus()
        this.showCurrentRegion()
    }

    async challenge(region = this.region, event) {
        if (!region || !region.name) throw new Error("Invalid region")
        if (!region.status) throw new Error("Unknown region status")
        if (region.status.locked) this.showError(`This region's challenge has already been successfully completed by ${region.status.owner}`, e)
        if (this.teamName in region.status.attempts) this.showError(`You have already attempted this region's challenge!`, e)

        const { distance, accuracy } = this.getDistance()
        if (distance - accuracy > this.maxDistance) this.showError(`You are too far away from the challenge location! Move closer to ${this.region.building} to start the challenge`, e)
        
        await loadPage("challenge", this.region, this.teamName)
    }

    showError(message, { clientX, clientY }) {
        const el = this.ui.errorMessage(message)
        el.style.left = clientX
        el.style.top = clientY
        document.body.appendChild(el)
        this.addEventListener("click", () => el.remove(), true)
    }

    // Reactions

    async onMove(position) {
        if (!position.latitude || !position.longitude) return

        this.map.setYouAreHere(position)

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
        
        if (region.status.locked || (this.teamName in region.status.attempts)) {
            challengeButton.disabled = true
            challengeButton.classList.remove("tooFar")
            challengeButton.classList.add("alreadyDone")
        } else {
            const { distance, accuracy } = this.getDistance()
            const tooFar = distance - accuracy > this.maxDistance
            challengeButton.disabled = tooFar
            challengeButton.classList.toggle("tooFar", tooFar)
        }
    }

    showCurrentRegion() {
        if (!this.region) return
        
        this.ui.regionTitle(this.region, this.region.status.owner, document.querySelector("#region"))
        this.ui.buildingDistanceLabel(this.region, this.getDistance(), document.querySelector("#buildingDistance"))
    }
}
