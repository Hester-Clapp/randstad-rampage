function constructURL(path, params) {
    const pathname = `/${path.map(encodeURIComponent).join("/")}`
    if (!params) return pathname

    const parameters = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&")
    return`${pathname}?${parameters}`
}

async function get(url, fallback) {
    return await fetch(url).then(res => res.ok ? res.json() : fallback)
}

async function put(url) {
    const res = await fetch(url, { method: "PUT" })
    if (!res.ok) throw new Error(await res.text())
    return res
}

export async function whichRegionContains(position) {
    return await get(constructURL(["regionQuery"], position))
}

export async function getRegionStatus(region) {
    const fallback = { owner: "Unknown", claimed: true, locked: true }
    return await get(constructURL(["region", region.name, "status"]), fallback)
}

export async function claimRegion(region, teamName) {
    return await put(constructURL(["region", region.name, "claim"], { teamName }))
}

export async function challengeRegion(region, teamName, success) {
    return await put(constructURL(["region", region.name, "challenge"], { teamName, success }))
}