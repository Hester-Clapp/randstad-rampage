export class TeamTracker {
    constructor() {
        this.teams = {}
        this.maxStay = 4 * 3600_000 // 4 hours
    }

    get() {
        this.removeOldData()
        return this.teams
    }

    update(teamName, position) {
        this.teams[teamName] = position
    }

    removeOldData() {
        const now = Date.now()
        for (const [teamName, { timestamp }] of Object.entries(this.teams)) {
            if (now - timestamp > this.maxStay) {
                delete this.teams[teamName]
            }
        }
    }
}