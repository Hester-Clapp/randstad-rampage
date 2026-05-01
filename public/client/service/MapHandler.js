export class MapHandler {
    constructor() {
        this.colors = ["crimson", "orange", "limegreen", "indigo"]

        this.map = L.map('map').setView([52, 4.35], 12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);
        
        this.populate()
    }

    async populate() {
        const regions = await fetch("/mapData").then(res => res.json())

        for (const region of regions) {
            for (const polygon of region.polygons) {
                L.polygon(polygon, {
                    color: this.colors[region.color],
                    fillColor: this.colors[region.color],
                    fillOpacity: 0.1
                }).bindPopup(region.name).addTo(this.map)

                // if (region.name.startsWith("Rotterdam")) {
                //     for (const [lat, lon] of polygon) {
                //         L.marker([lat, lon]).bindPopup(`[${lon}, ${lat}]`).addTo(this.map)
                //     }
                // }
            }

            L.marker([region.position.latitude, region.position.longitude])
                .bindPopup(region.building).addTo(this.map)
        }
    }
}