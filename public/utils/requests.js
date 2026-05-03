function constructURL(path, params) {
    const pathname = `/${path.map(encodeURIComponent).join("/")}`
    if (!params) return pathname

    const parameters = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&")
    return`${pathname}?${parameters}`
}

async function get(path, params, fallback = null) {
    return await fetch(constructURL(path, params)).then(res => res.ok ? res.json() : fallback)
}

async function put(path, params) {
    const res = await fetch(constructURL(path, params), { method: "PUT" })
    if (!res.ok) throw new Error(await res.text())
    return res
}

export async function whichRegionContains(position) {
    return await get(["region"], position)
}

export async function getRegionStatus(region) {
    const fallback = { owner: "Unknown", claimed: true, locked: true }
    return await get(["regions", region.name, "status"], {}, fallback)
}

export async function claimRegion(region, teamName) {
    return await put(["regions", region.name, "claim"], { teamName })
}

export async function challengeRegion(region, teamName, success) {
    return await put(["regions", region.name, "challenge"], { teamName, success })
}

export async function getScores() {
    return await get(["scores"])
}