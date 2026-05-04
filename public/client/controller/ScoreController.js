import { Controller } from './Controller.js';

import { UIFactory } from '../service/UIFactory.js';

import { getScores } from "../../utils/requests.js"

export class ScoreController extends Controller {
    async beforeLoad(teamName) {
        super.beforeLoad()

        this.ui = new UIFactory()
        
        this.teamName = teamName
    }

    async afterLoad() {
        super.afterLoad()

        this.ui.header("score", this.teamName, document.querySelector("header"))

        const scores = await getScores()
        if (!(this.teamName in scores)) scores[this.teamName] = { claimed: 0, locked: 0 }
        const sortedEntries = Object.entries(scores).sort((a, b) => b[1] - a[1])

        const list = document.querySelector("tbody")
        for (const [teamName, score] of sortedEntries) {
            list.appendChild(this.ui.scoreCard(teamName, score))
        }
    }
}
