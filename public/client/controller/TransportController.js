import { Controller } from './Controller.js';

import { UIFactory } from '../service/UIFactory.js';

export class TransportController extends Controller {
    async beforeLoad(teamName) {
        super.beforeLoad()

        this.ui = new UIFactory()
        
        this.teamName = teamName
    }

    async afterLoad() {
        super.afterLoad()

        this.ui.header("transport", this.teamName, document.querySelector("header"))
    }
}
