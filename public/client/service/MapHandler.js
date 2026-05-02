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
        this.regions[regionName].setStyle({color: color, fillColor: color})
        this.regions[regionName].bringToFront()
    }
}