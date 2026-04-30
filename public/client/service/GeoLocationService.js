export class GeoLocationService extends EventTarget {
    lastPosition = { coords: { latitude: null, longitude: null, accuracy: null }, timestamp: null }

    constructor() {
        super()

        this.permission = new Promise((resolve, reject) => {
            this.watchId = navigator.geolocation.watchPosition(async (position) => {
                await this.updatePosition(position)
                resolve()
            }, reject)
        })
    }

    async updatePosition(position) {
        if (!position) position = await this.getPosition()
        this.lastPosition = position
        this.dispatchEvent(new CustomEvent('move', { detail: this.position }))
    }

    async getPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject)
        })
    }

    get position() {
        const { latitude, longitude, accuracy } = this.lastPosition.coords
        const age = Date.now() - this.lastPosition.timestamp
        return { latitude, longitude, accuracy, age }
    }

    distance(x, y) {
        const R = 6371000
        const toRad = (deg) => (deg * Math.PI) / 180
        const dLat = toRad(y.latitude - x.latitude)
        const dLon = toRad(y.longitude - x.longitude)
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(x.latitude)) * Math.cos(toRad(y.latitude)) * Math.sin(dLon / 2) ** 2
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const lower = Math.round(Math.max(0, distance - x.accuracy - y.accuracy))
        const upper = Math.round(distance + x.accuracy + y.accuracy)
        return { lower, upper }
    }

    cleanup() {
        if (this.watchId) navigator.geolocation.clearWatch(this.watchId)
    }
}