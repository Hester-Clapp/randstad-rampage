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

    cleanup() {
        if (this.watchId) navigator.geolocation.clearWatch(this.watchId)
    }
}

export class GeoLocationMock extends GeoLocationService {
    lastPosition = { coords: { latitude: 52, longitude: 4.35, accuracy: 10 }, timestamp: Date.now() }

    constructor() {
        super()

        this.permission = Promise.resolve()
        setInterval(() => this.updatePosition(this.lastPosition), 10000)
    }

    async updatePosition(position) {
        this.dispatchEvent(new CustomEvent('move', { detail: this.lastPosition }))
    }

    cleanup() {
        
    }
}