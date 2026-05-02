export class MapHandler {
    constructor() {
        this.colors = ["crimson", "orange", "limegreen", "indigo"]

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
            this.regions[region.name] = L.polygon(region.polygon, {
                color: "white",
                fillColor: "white",
                fillOpacity: 0.2
            }).bindPopup(region.name).addTo(this.map)

            this.buildings[region.name] = L.marker([region.position.latitude, region.position.longitude])
                .bindPopup(region.building).addTo(this.map)
        }
    }
}