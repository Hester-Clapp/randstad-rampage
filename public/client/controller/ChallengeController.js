import { Controller } from './Controller.js';
import { loadPage } from './pageLoader.js';

import { UIFactory } from '../service/UIFactory.js';

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
        this.ui.challengeTimer(this.region, document.querySelector("#timer"))
    }

    // Actions

}
