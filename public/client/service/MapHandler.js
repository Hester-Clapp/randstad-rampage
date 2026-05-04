import { UIFactory } from "./UIFactory.js"

import { getColor } from "../../utils/team-color.js"
import { getRegionStatus } from "../../utils/requests.js"

export class MapHandler {
    constructor() {
        this.ui = new UIFactory()

        this.regions = {}
        this.buildings = {}
    }

    async populate({ latitude, longitude }) {
        if (this.map) {
            this.map.remove()
        }
        this.yahMarker = null
        this.yahCircle = null
        this.regions = {}
        this.buildings = {}
        this.map = L.map('map').setView([latitude, longitude], 12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);

        const regions = await fetch("/map-data").then(res => res.json())

        for (const region of regions) {
            const polygon = L.polygon(region.polygon, {
                color: "white",
                fillColor: "white",
                fillOpacity: 0.2
            }).bindPopup("").addTo(this.map)

            const marker = L.marker([region.position.latitude, region.position.longitude])
                .bindPopup().addTo(this.map)

            polygon.addEventListener("click", async () => {
                const { owner } = await getRegionStatus(region)
                const el = this.ui.regionTitle(region, owner)
                polygon.setPopupContent(el.outerHTML)
                polygon.openPopup()
            })

            marker.addEventListener("click", () => {
                const el = this.ui.buildingTitle(region)
                marker.setPopupContent(el.outerHTML)
                marker.openPopup()
            })

            this.regions[region.name] = polygon
            this.buildings[region.name] = marker
        }

        await this.setOwners()
    }

    setOwner(regionName, teamName) {
        console.log(teamName)
        const color = getColor(teamName)
        const region = this.regions[regionName]
        if (!region) return
        region.setStyle({color: color, fillColor: color})
        region.bringToFront()
    }

    async setOwners() {
        const regions = await fetch("/statuses").then(res => res.json())
        for (const region of regions) {
            if (region.status.claimed) this.setOwner(region.name, region.status.owner)
        }
    }

    disableMarker(regionName) {
        const marker = this.buildings[regionName]
        if (!marker) return
        const el = marker.getElement()
        if (el) {
            el.style.filter = 'grayscale(100%) opacity(0.5)'
            el.style.pointerEvents = 'none'
        }
        marker.off('click')
    }

    initYouAreHere() {
        const icon = L.divIcon({
            className: 'yah-icon',
            html: '<div class="yah-dot"></div><div class="yah-ring"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
        this.yahPos = null
        this.yahRadius = null
        this.yahFrame = null
        this.yahCircle = L.circle([0, 0], {
            radius: 0,
            color: "var(--team-color)",
            fillColor: "var(--team-color)",
            fillOpacity: 0.2,
            weight: 1.5,
            opacity: 0.5,
            interactive: false
        })
        this.yahMarker = L.marker([0, 0], { icon, zIndexOffset: 1000, interactive: false })
    }

    setYouAreHere({ latitude, longitude, accuracy }) {
        if (!this.yahMarker) this.initYouAreHere()

        const fromPos = this.yahPos ? [...this.yahPos] : [latitude, longitude]
        const fromRadius = this.yahRadius ?? accuracy
        const toPos = [latitude, longitude]
        const toRadius = accuracy
        const duration = 600
        const start = document.timeline.currentTime

        if (this.yahFrame) cancelAnimationFrame(this.yahFrame)

        if (!this.yahMarker.map) {
            this.yahCircle.addTo(this.map)
            this.yahMarker.addTo(this.map)
        }

        const tick = (now) => {
            const t = Math.min((now - start) / duration, 1)
            const ease = 1 - (1 - t) ** 2

            const latitude = fromPos[0] + (toPos[0] - fromPos[0]) * ease
            const longitude = fromPos[1] + (toPos[1] - fromPos[1]) * ease
            const accuracy = fromRadius + (toRadius - fromRadius) * ease

            this.yahMarker.setLatLng([latitude, longitude])
            this.yahCircle.setLatLng([latitude, longitude])
            this.yahCircle.setRadius(accuracy)

            if (t < 1) {
                this.yahFrame = requestAnimationFrame(tick)
            } else {
                this.yahPos = toPos
                this.yahRadius = toRadius
                this.yahFrame = null
            }
        }

        this.yahFrame = requestAnimationFrame(tick)
    }
}