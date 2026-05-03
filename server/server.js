import { serveDir } from "https://deno.land/std/http/file_server.ts";
import { RegionService } from "./service/RegionService.js"

const services = {
    region: await RegionService.create(),
}

async function handle(req) {
    const url = new URL(req.url);
    const { pathname, searchParams } = url;
    const segments = pathname.split("/").slice(1)
    console.log(pathname)
    
    const GET = (req.method === "GET")
    const POST = (req.method === "POST")
    const PUT = (req.method === "PUT")
    const DELETE = (req.method === "DELETE")

    const region = (segments[0] === "region") ? decodeURIComponent(segments[1]) : null
    if (region && (GET || POST || PUT) && !services.region.isValid(region)) return new Response(`Invalid region: ${region}`, { status: 400 })

    if (GET && pathname === "/map-data") {
        const data = await services.region.getAllPolygons()
        return json(data)
    }

    if (GET && pathname === "/region-query") {
        const latitude = Number(searchParams.get("latitude"))
        const longitude = Number(searchParams.get("longitude"))
        if (!latitude) return new Response("Invalid Latitude", { status: 400 })
        if (!longitude) return new Response("Invalid Longitude", { status: 400 })

        const result = await services.region.whichRegionContains({ latitude, longitude })
        return json(services.region.get(result))
    }

    if (GET && region && segments[2] === "status") {
        const status = await services.region.getStatus(region)
        return json(status)
    }

    if (PUT && region && segments[2] === "claim") {
        const teamName = searchParams.get("teamName")
        if (!teamName) return new Response(`Invalid team name: ${teamName}`, { status: 400 })

        try {
            await services.region.claim(region, teamName)
            const status = await services.region.getStatus(region)
            // if (!status) return new Response(`Status for ${region} unknown`, { status: 404 })
            return json(status)
        } catch(e) {
            return new Response(e.message, { status: 500 })
        }

    }

    if (PUT && region && segments[2] === "challenge") {
        const teamName = searchParams.get("teamName")
        const success = (searchParams.get("success") === "true")
        const status = await services.region.challenge(region, teamName, success)
        return json(status)
    }

    if (DELETE && segments[0] === "region") {
        await services.region.reset()
        return new Response(null, { status: 200 })
    }

    // ---- Static files ----
    return serveDir(req, {
        fsRoot: "public",
        urlRoot: "",
    });
}

function json(data, status = 200) {
    // console.log(data)
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}
if (import.meta.main) {
    console.log("Starting server...")
    Deno.serve(handle, { port: Deno.env.get("PORT") || 8000 });
}