export async function whichRegionContains({ latitude, longitude }) {
    return await fetch(`/regionQuery?lat=${latitude}&lon=${longitude}`).then(res => res.json())
}

export async function getRegionStatus(region) {
    return await fetch(`/region/${encodeURIComponent(region.name)}/status`)
        .then(res => res.ok ? res.json() : { owner: "Unknown", claimed: true, locked: true })
}

export async function claimRegion(region, teamName) {
    const res = await fetch(`/region/${encodeURIComponent(region.name)}/claim?teamName=${encodeURIComponent(teamName)}`, { method: "PUT" })
    if (!res.ok) throw new Error(await res.text())
    return res
}