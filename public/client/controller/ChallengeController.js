import { Controller } from './Controller.js';
import { loadPage } from './pageLoader.js';

import { UIFactory } from '../service/UIFactory.js';

import { challengeRegion } from '../../utils/requests.js';

export class ChallengeController extends Controller {
    async beforeLoad(region, teamName) {
        super.beforeLoad()

        this.ui = new UIFactory()
        
        this.region = region
        this.teamName = teamName
    }

    async afterLoad() {
        super.afterLoad()

        this.ui.challengeTitle(this.region, document.querySelector("#title"))
        this.ui.challengeDescription(this.region, document.querySelector("#description"))
        this.ui.challengeTime(this.region, document.querySelector("#time"))
        const timer = this.ui.challengeTimer(this.region, document.querySelector("#timer"))
        timer.addEventListener("finish", () => this.onFinish())
        timer.addEventListener("click", () => {
            document.querySelector("#app").appendChild(this.ui.skipTimer(timer))
        })
    }

    // Reactions

    async onFinish() {
        this.ui.challengeResult(async (result) => {
            await challengeRegion(this.region, this.teamName, result)
            navigator.vibrate(50)
            loadPage("regions", this.teamName, result && this.region.name)
        }, document.querySelector("#result"))
    }
}
