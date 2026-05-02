export function getColor(teamName) {
    if (teamName === "Neutral") return "white"
    if (teamName === "Unknown") return "grey"

    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
        hash = (Math.imul(31, hash) + teamName.charCodeAt(i)) | 0;
    }
    const hue = (hash >>> 0) % 360;
    return `hsl(${hue}deg, 80%, 50%)`;
}

export function getColorNeutralBlack(teamName) {
    if (teamName === "Neutral") return "black"
    return getColor(teamName)
}