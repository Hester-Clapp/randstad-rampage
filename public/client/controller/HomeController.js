import { Controller } from './Controller.js';
import { loadPage } from './pageLoader.js';

export class HomeController extends Controller {
    res

    async beforeLoad() {
        super.beforeLoad()
    }

    async afterLoad() {
        super.afterLoad()

        this.teamName = sessionStorage.getItem("teamName") || ""
        if (this.teamName) await this.login()

        const field = document.getElementById("teamName")
        this.teamName = this.teamName || localStorage.getItem("teamName") || ""

        document.querySelector("form").addEventListener("submit", async (e) => {
            e.preventDefault();
            this.teamName = field.value
            await this.login()
        }, { once: true });
    }

    async login() {
        if (this.teamName) {
            localStorage.setItem("teamName", this.teamName)
            sessionStorage.setItem("teamName", this.teamName)
        } else {
            this.teamName = "Default Team"
        }
        loadPage("regions");
    }
}
