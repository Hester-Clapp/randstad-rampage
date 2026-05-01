import { serveDir } from "https://deno.land/std/http/file_server.ts";
import { RegionService } from "./service/RegionService.js"

const services = {
    region: new RegionService()
}

async function handle(req) {
    const url = new URL(req.url);
    const { pathname, searchParams } = url;

    if (pathname === "/regionQuery") {
        const latitude = Number(searchParams.get("lat"))
        const longitude = Number(searchParams.get("lon"))
        if (!latitude) return new Response("Invalid Latitude", {status:400})
        if (!longitude) return new Response("Invalid Longitude", {status:400})

        const region = await services.region.whichRegionContains({ latitude, longitude })
        console.log(region)
        return json(services.region.getRegionData(region))
    }

    // ---- Static files ----
    return serveDir(req, {
        fsRoot: "public",
        urlRoot: "",
    });
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

if (import.meta.main) {
    console.log("Starting server...")
    Deno.serve(handle, { port: Deno.env.get("PORT") || 8000 });
}