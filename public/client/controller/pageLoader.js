import { HomeController } from "./HomeController.js";
import { RegionsController } from "./RegionsController.js";
import { ChallengeController } from "./ChallengeController.js";

const controllers = {
    home: new HomeController(),
    regions: new RegionsController(),
    challenge: new ChallengeController(),
}

window.ctrl = controllers

const app = document.getElementById("app")

export async function loadPage(page, ...args) {
    try {
        document.body.style.cursor = "wait"
        await controllers[page].beforeLoad(...args);

        const res = await fetch(`/resources/pages/${page}.html`);
        if (!res.ok) throw new Error(`Failed to load page: ${res.statusText}`);

        const html = await res.text();
        app.innerHTML = html;

        document.body.style.cursor = "auto"
        await controllers[page].afterLoad()
    } catch (err) {
        console.error(err);
        app.innerHTML = `
        <h1>Failed to load page</h1>
        <p>${err.message}</p>
        <ul>${err.stack.split("at ").map(line => `<li>at ${line}</li>`).join("")}</ul>`;
    }
}   