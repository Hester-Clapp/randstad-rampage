import { DistanceCalculator } from "./DistanceCalculator.js"

import { getColorNeutralBlack } from "../../utils/team-color.js"

export class UIFactory {

    constructor() {
        this.dist = new DistanceCalculator()
    }

    setup(el, cssClass) {
        el.classList.add(cssClass)
        el.innerHTML = ""
        return el
    }

    textEl(el, cssClass, text) {
        el.classList.add(cssClass)
        el.textContent = text
        return el
    }

    regionTitle(region, owner = region.status.owner || "Unknown", el =  document.createElement("h2") ) {
        this.setup(el, "regionTitle")
        el.textContent = region.name

        const span = document.createElement("span")
        span.textContent = owner
        span.style.color = getColorNeutralBlack(owner)
        el.append(" - ", span)
        return el
    }

    buildingDistanceLabel(region, distance, el =  document.createElement("p")) {
        this.setup(el, "buildingDistanceLabel")
        el.textContent = `${this.dist.format(distance)} from `
        const owner = document.createElement("i")
        owner.textContent = region.building
        el.append(owner)
        return el
    }

    buildingTitle(region, el =  document.createElement("h2")) {
        return this.textEl(el, "buildingTitle", region.building)
    }

    challengeTitle(region, el =  document.createElement("h1")) {
        return this.textEl(el, "challengeTitle", `${region.name} Challenge`)
    }

    challengeDescription(region, el =  document.createElement("p")) {
        return this.textEl(el, "challengeDescription", region.challenge)
    }

    challengeTime(region, el =  document.createElement("p")) {
        return this.textEl(el, "challengeTime", `You have ${region.time} minutes to complete this challenge`)
    }

    challengeTimer(region, el =  document.createElement("button")) {
        this.setup(el, "challengeTimer")

        const challengeTime = region.time * 60_000
        let startTime

        const time = document.createElement("output")
        const progress = document.createElement("div")
        progress.classList.add("circle-progress")

        function display(timeElapsed) {
            const timeRemaining = challengeTime - timeElapsed
            const minutes = Math.floor(timeRemaining / 60_000)
            const seconds = Math.floor((timeRemaining - minutes * 60_000) / 1000)
            time.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`
            progress.style.setProperty('--p', timeRemaining / challengeTime)
        }

        function start() {
            startTime = document.timeline.currentTime + 1000
            el.innerHTML = ""
            el.append(time, progress)
            window.requestAnimationFrame(tick)
        }

        function finish() {
            el.textContent = "Time's Up!"
            el.dispatchEvent(new CustomEvent("finish"))
            navigator.vibrate([500, 500, 500, 500, 500])
        }

        function tick(currentTime) {
            const timeElapsed = currentTime - startTime
            if (startTime) display(timeElapsed)

            if (startTime && (timeElapsed > challengeTime)) finish()
            else window.requestAnimationFrame(tick)
        }

        el.textContent = "Start"
        el.addEventListener("click", start, { once:true })

        return el
    }

    challengeResult(callback, el =  document.createElement("div") ) {
        this.setup(el, "challengeResult")

        const p = document.createElement("p")
        p.textContent = "Did you succeed?"

        const { signal } = new AbortController()

        const success = document.createElement("button")
        success.textContent = "Yes"
        success.classList.add("green")
        success.addEventListener("click", () => callback(true), { signal })

        const fail = document.createElement("button")
        fail.textContent = "No"
        fail.classList.add("red")
        fail.addEventListener("click", () => callback(false), { signal })

        el.append(p, success, fail)
        return el
    }

    errorMessage(message, el = document.createElement("div") ) {
        return this.textEl(el, "challengeResult", message)
    }
}
