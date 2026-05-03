import regions from '../../data/regions.json' with { type: 'json' };

export class RegionRepository {
    kv;

    constructor(kv) {
        this.kv = kv;
    }

    static async create() {
        const kv = await Deno.openKv();
        return new RegionRepository(kv);
    }

    contains(name) {
        return regions.some(region => region.name === name)
    }

    get(name) {
        if (!name) return null;
        const candidates = regions.filter(region => region.name === name);
        if (candidates.length > 0) return candidates[0];
        return null;
    }

    getAllRegions() {
        return [...regions]
    }

    async getStatus(name) {
        const claimerEntry = await this.kv.get(["region", name, "claimer"]);

        const attempts = {}
        let successfulChallenger = null;
        for await (const entry of this.kv.list({ prefix: ["region", name, "challengers"] })) {
            attempts[entry.key.at(-1)] = entry.value
            if (entry.value === true) successfulChallenger = entry.key.at(-1)
        }

        const owner = successfulChallenger || claimerEntry.value || null;

        return {
            owner,
            attempts,
            claimed: claimerEntry.value ? true : false,
            locked: successfulChallenger ? true : false,
        }
    }

    async claim(regionName, teamName) {
        this.validate(regionName, teamName)
        
        await this.kv.set(["region", regionName, "claimer"], teamName);
    }

    async challenge(regionName, teamName, success) {
        this.validate(regionName, teamName)

        const existing = await this.kv.get(["region", regionName, "challengers", teamName]);
        if (existing.value !== null) return false;

        await this.kv.set(["region", regionName, "challengers", teamName], success);
        return success;
    }

    async reset() {
        const promises = [];
        for await (const entry of this.kv.list({ prefix: ["region"] })) {
            promises.push(this.kv.delete(entry.key));
        }
        await Promise.all(promises);
    }

    validate(regionName, teamName) {
        if (!regions.some(r => r.name === regionName)) throw new Error(`Cannot claim unknown region: ${regionName}`);
        if (!teamName) throw new Error(`Invalid team name: ${teamName}`);
    }
}
