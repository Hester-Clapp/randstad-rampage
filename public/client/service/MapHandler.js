import { UIFactory } from "./UIFactory.js"

import { getColor } from "../../utils/team-color.js"
import { getRegionStatus } from "../../utils/requests.js"

export class MapHandler {
    constructor() {
        this.ui = new UIFactory()

        this.map = L.map('map').setView([52, 4.35], 12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);

        this.regions = {}
        this.buildings = {}
        this.teamMarkers = {}
        
        this.populate()
    }

    async populate() {
        const regions = await fetch("/mapData").then(res => res.json())

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
    }

    setOwner(regionName, teamName) {
        const color = getColor(teamName)
        const region = this.regions[regionName]
        if (!region) return
        region.setStyle({color: color, fillColor: color})
        region.bringToFront()
    }

    disableMarker(regionName) {
        const marker = this.buildings[regionName]
        if (!marker) return
        const el = marker.getElement()
        if (el) el.style.filter = 'grayscale(100%) brightness(0.5)'
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
            color: "#4285F4",
            fillColor: "#4285F4",
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

    
    setTeamLocation({ latitude, longitude, timestamp }, teamName) {
        if (!teamName || teamName === "Neutral") return

        if (!this.teamFadeInterval) this.teamFadeInterval = setInterval(() => this.updateTeamFades(), 10_000)

        if (this.teamMarkers[teamName]) {
            const entry = this.teamMarkers[teamName]
            entry.marker.setLatLng([latitude, longitude])
            entry.timestamp = timestamp
            const el = entry.marker.getElement()
            if (el) el.style.opacity = 1
        } else {
            const color = getColor(teamName)
            const label = teamName.length > 12 ? teamName.slice(0, 12) + '…' : teamName
            const icon = L.divIcon({
                className: 'team-icon',
                html: `<div class="team-marker" style="--team-color:${color}">
                    <div class="team-bubble">
                        <svg viewBox="0 0 20 22" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10" cy="6" r="4" fill="white"/>
                            <path d="M1 21c0-5 4-9 9-9s9 4 9 9" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div class="team-label">${label}</div>
                </div>`,
                iconSize: [80, 52],
                iconAnchor: [40, 18]
            })
            const marker = L.marker([latitude, longitude], { icon, zIndexOffset: 500 }).addTo(this.map)
            const entry = { timestamp, marker }
            this.teamMarkers[teamName] = entry
            marker.on('click', () => {
                const age = Date.now() - entry.timestamp
                L.popup()
                    .setLatLng(marker.getLatLng())
                    .setContent(`<b>${teamName}</b><br>Last seen ${this.formatTimeAgo(age)}`)
                    .openOn(this.map)
            })
        }

        this.updateTeamFades()
    }

    formatMeasurement(quantity, unit) {
        return `${quantity} ${unit}${quantity === 1 ? '' : 's'}`
    }

    formatTimeAgo(ms) {
        const s = Math.floor(ms / 1000)
        if (s < 60) return `${this.formatMeasurement(s, "second")} ago`
        const m = Math.floor(s / 60)
        if (m < 60) return `${this.formatMeasurement(m, "minute")} ago`
        const h = Math.floor(m / 60)
        return `${h}h ${m % 60}m ago`
    }

    updateTeamFades() {
        const FADE_START_MS = 5 * 60_000
        const FADE_END_MS = 10 * 60_000
        const MIN_OPACITY = 0.2
        for (const { marker, timestamp } of Object.values(this.teamMarkers)) {
            const age = Date.now() - timestamp
            const opacity = age < FADE_START_MS ? 1
                : 1 - (1 - MIN_OPACITY) * Math.min((age - FADE_START_MS) / (FADE_END_MS - FADE_START_MS), 1)
            const el = marker.getElement()
            if (el) el.style.opacity = opacity
        }
    }

}