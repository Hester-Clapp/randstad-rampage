export class DistanceCalculator {
    
    distance(x, y) {
        const R = 6371000
        const toRad = (deg) => (deg * Math.PI) / 180
        const dLat = toRad(y.latitude - x.latitude)
        const dLon = toRad(y.longitude - x.longitude)
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(x.latitude)) * Math.cos(toRad(y.latitude)) * Math.sin(dLon / 2) ** 2
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const accuracy = x.accuracy + y.accuracy
        return { distance, accuracy }
    }

    format(measurement) {
        if (typeof measurement === "number") return this.format({ distance: measurement, accuracy: 0 })
        const { distance, accuracy } = measurement
    
        const percentage = Math.round(100 * accuracy / distance)
        const formattedDistance = (distance < 1000) ? `${Math.floor(distance / 10) * 10}m` :  `${Math.floor(distance / 100) / 10}km`
        return (percentage > 0) ? `${formattedDistance} ± ${percentage}%` : formattedDistance
    }
}