import { DistanceCalculator } from "./DistanceCalculator.js"

import { getColorNeutralBlack } from "../../utils/team-color.js"

export class UIFactory {

    constructor() {
        this.dist = new DistanceCalculator()
    }

    regionTitle(region, 
        owner = region.status.owner || "Unknown", 
        el = document.createElement("h2")
    ) {
        el.className = "regionTitle"
        el.innerHTML = ""

        el.textContent = region.name

        const span = document.createElement("span")
        span.textContent = owner
        span.style.color = getColorNeutralBlack(owner)
        el.append(" - ", span)
        return el
    }

    buildingDistanceLabel(region, 
        distance, 
        el = document.createElement("p")
    ) {
        el.className = "buildingDistanceLabel"
        el.innerHTML = ""

        el.textContent = `${this.dist.format(distance)} from `
        const owner = document.createElement("i")
        owner.textContent = region.building
        el.append(owner)
        return el
    }
    
    buildingTitle(region,  
        el = document.createElement("h2")
    ) {
        el.className = "buildingTitle"
        el.innerHTML = ""

        el.textContent = region.building
        return el
    }
    
}