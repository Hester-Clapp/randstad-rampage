import { Controller } from './Controller.js';
import { loadPage } from './pageLoader.js';

import { getColor } from "../../utils/team-color.js"

export class HomeController extends Controller {
    res

    async beforeLoad() {
        super.beforeLoad()
    }

    async afterLoad() {
        super.afterLoad()

        this.teamName = window.sessionStorage.getItem("teamName") || ""
        if (this.teamName) await this.login()

        this.field = document.getElementById("teamName")
        this.teamName = this.teamName || window.localStorage.getItem("teamName") || ""
        this.field.value = this.teamName
        
        this.updateTextColor()
        this.field.addEventListener("input", () => this.updateTextColor())

        document.querySelector("form").addEventListener("submit", async (e) => {
            e.preventDefault();
            this.teamName = this.field.value
            await this.login()
        }, { once: true });
    }

    updateTextColor() {
        this.field.style.color = getColor(this.field.value)
    }

    async login() {
        if (this.teamName) {
            window.localStorage.setItem("teamName", this.teamName)
        } else {
            this.teamName = "Default Team"
        }
        window.sessionStorage.setItem("teamName", this.teamName)
        loadPage("regions", this.teamName);
    }
}
