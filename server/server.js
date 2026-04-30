import { serveDir } from "https://deno.land/std/http/file_server.ts";
import { RegionService } from "./service/RegionService.js"

const region = new RegionService()

async function handle(req) {
    const url = new URL(req.url);
    const { pathname, searchParams } = url;

    if (pathname === "/regionQuery") {
        const latitude = searchParams.get("lat")
        const longitude = searchParams.get("lon")
        return json(await region.getRegion({ latitude, longitude }))
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