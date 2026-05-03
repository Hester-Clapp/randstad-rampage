import { Controller } from './Controller.js';
import { UIFactory } from '../service/UIFactory.js';

const SVG_WIDTH = 3578
const SVG_HEIGHT = 2580
const SVG_PATH = '/resources/svg/transport.svg'

export class TransportController extends Controller {
    async beforeLoad(teamName) {
        super.beforeLoad()

        this.ui = new UIFactory()
        this.teamName = teamName
    }

    async afterLoad() {
        super.afterLoad()

        this.ui.header("transport", this.teamName, document.querySelector("header"))

        const bounds = [[0, 0], [SVG_HEIGHT, SVG_WIDTH]]

        this.map = L.map('transport-map', {
            crs: L.CRS.Simple,
            minZoom: -3,
            maxZoom: 2,
            zoomSnap: 0.5,
            zoomDelta: 0.5,
            attributionControl: false,
        })

        L.imageOverlay(SVG_PATH, bounds).addTo(this.map)

        const saved = sessionStorage.getItem('transportMapView')
        if (saved) {
            const { center, zoom } = JSON.parse(saved)
            this.map.setView(center, zoom)
        } else {
            this.map.fitBounds(bounds)
        }

        this.map.on('moveend zoomend', () => {
            const center = this.map.getCenter()
            const zoom = this.map.getZoom()
            sessionStorage.setItem('transportMapView', JSON.stringify({ center, zoom }))
        })
    }
}
