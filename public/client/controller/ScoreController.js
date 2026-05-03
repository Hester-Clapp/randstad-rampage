import { Controller } from './Controller.js';

import { UIFactory } from '../service/UIFactory.js';

export class ScoreController extends Controller {
    async beforeLoad(teamName) {
        super.beforeLoad()

        this.ui = new UIFactory()
        
        this.teamName = teamName
    }

    async afterLoad() {
        super.afterLoad()

        this.ui.header("score", this.teamName, document.querySelector("header"))
    }
}
