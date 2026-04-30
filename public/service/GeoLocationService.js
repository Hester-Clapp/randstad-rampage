export class GeoLocationService {
    #position = null

    request() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.#position = position
                    resolve()
                },
                (error) => reject(error)
            )
        })
    }

    get() {
        if (!this.#position) throw new Error('Location not available. Call request() first.')
        const { latitude, longitude, accuracy } = this.#position.coords
        return { latitude, longitude, accuracy }
    }

    distance(x, y) {
        const R = 6371000
        const toRad = (deg) => (deg * Math.PI) / 180
        const dLat = toRad(y.lat - x.lat)
        const dLon = toRad(y.lon - x.lon)
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(x.lat)) * Math.cos(toRad(y.lat)) * Math.sin(dLon / 2) ** 2
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }
}
