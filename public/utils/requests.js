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

async function notify(message) {
    // const id = ""
    // const baseURL = `...`
    // return await fetch(`${baseURL}/${id}`, { method: "POST" })
    
    return await fetch(`/webhook-mock?message=${message}`, { method: "POST" })
}

export async function whichRegionContains(position) {
    return await get(["region"], position)
}

export async function getRegionStatus(region) {
    const fallback = { owner: "Unknown", claimed: true, locked: true }
    return await get(["regions", region.name, "status"], {}, fallback)
}

export async function claimRegion(region, teamName) {
    const res = await put(["regions", region.name, "claim"], { teamName })
    if (res.ok) await notifyClaim(region, teamName)
    return res
}

export async function challengeRegion(region, teamName, success) {
    const previousOwner = region.status?.owner || null
    const res = await put(["regions", region.name, "challenge"], { teamName, success })
    if (res.ok) await notifyChallenge(region, teamName, success, previousOwner)
    return res
}

export async function getScores() {
    return await get(["scores"])
}

async function notifyClaim(region, teamName) {
    const message = `${teamName} claimed ${region.name}!`
    return await notify(message)
}

export async function notifyStartChallenge(region, teamName) {
    const message = `${teamName} started the ${region.name} challenge...`
    return await notify(message)
}

async function notifyChallenge(region, teamName, success, previousOwner) {
    const message = success
        ? previousOwner
            ? (teamName === previousOwner)
                ? `${teamName} completed the ${region.name} challenge and locked it down!`
                : `${teamName} completed the ${region.name} challenge and stole it from ${previousOwner}!`
            : `${teamName} completed the ${region.name} challenge!`
        : `${teamName} failed the ${region.name} challenge!`
    return await notify(message)
}