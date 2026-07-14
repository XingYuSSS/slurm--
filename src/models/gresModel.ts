// eslint-disable-next-line @typescript-eslint/naming-convention
import _ from "lodash";

export class Gres {
    readonly type: string;
    readonly name: string | null = null;
    readonly other: string | null = null;
    readonly num: number;
    readonly detail: string | null = null;

    constructor(gres: string) {
        const normalizedGres = gres.trim().replace(/^gres:/, '');
        const detailMatch = normalizedGres.match(/\(([^)]*)\)\s*$/);
        this.detail = detailMatch ? detailMatch[1] : null;

        const slicedGres = normalizedGres.replace(/\([^)]*\)\s*$/, '').split(":");
        this.type = slicedGres[0];
        this.name = slicedGres.length > 2 ? slicedGres[1] : null;
        this.other = slicedGres.length > 3 ? slicedGres.slice(2, -1).join(":") : null;
        this.num = parseInt(slicedGres[slicedGres.length - 1]);
    }

    toString() {
        return this.type + (this.name ? ':' + this.name : '') + (this.other ? ':' + this.other : '') + ':' + this.num.toString();
    }

    toIdString() {
        return this.type + (this.name ? ':' + this.name : '') + (this.other ? ':' + this.other : '');
    }
}

export class ResourceGres extends Gres {
    public usedNum: number = 0;
    public totalNum: number = 0;
    public availableNum: number = 0;

    constructor(usedGres: string, totalGres: string) {
        super(totalGres);
        const used = new Gres(usedGres);
        this.usedNum = used.num;
        this.totalNum = this.num;
        this.availableNum = ResourceGres.getAvailableNum(used.detail, this.totalNum, this.usedNum);
    }

    toString() {
        return this.type + (this.name ? ':' + this.name : '') + (this.other ? ':' + this.other : '') + ` (${this.availableNum}/${this.totalNum})`;
    }

    is(rgres: ResourceGres): boolean {
        return rgres.type === this.type && rgres.name === this.name && rgres.other === this.other;
    }

    add(rgres: ResourceGres): ResourceGres {
        this.usedNum += rgres.usedNum;
        this.totalNum += rgres.totalNum;
        this.availableNum += rgres.availableNum;
        return this;
    }

    static fromArray(rgresArray: ResourceGres[]): ResourceGres {
        if (rgresArray.length === 0) {
            throw new Error('empty array');
        }
        const rgres = _.cloneDeep(rgresArray[0]);
        rgresArray.slice(1).forEach(v => { rgres.add(v); });
        return rgres;
    }

    static empty(id: string): ResourceGres {
        return new ResourceGres(`${id}:0`, `${id}:0`);
    }

    static parseList(usedGresRaw: string, totalGresRaw: string): ResourceGres[] {
        const totalParts = splitGresList(totalGresRaw);
        const usedParts = splitGresList(usedGresRaw);

        const usedById = new Map<string, string>();
        for (const u of usedParts) {
            usedById.set(new Gres(u).toIdString(), u);
        }

        return totalParts.map(totalStr => {
            const id = new Gres(totalStr).toIdString();
            const usedStr = usedById.get(id) ?? `${id}:0`;
            return new ResourceGres(usedStr, totalStr);
        });
    }

    private static getAvailableNum(detail: string | null, totalNum: number, usedNum: number): number {
        const sharedAvailable = ResourceGres.getSharedAvailableNum(detail);
        if (sharedAvailable !== null) {
            return sharedAvailable;
        }
        return Math.max(0, totalNum - usedNum);
    }

    private static getSharedAvailableNum(detail: string | null): number | null {
        if (!detail || !detail.includes('/')) {
            return null;
        }

        let available = 0;
        let matched = false;

        for (const part of detail.split(',').map(v => v.trim()).filter(v => v.length > 0)) {
            const unavailableMatch = /^-\/(\d+)$/.exec(part);
            if (unavailableMatch) {
                matched = true;
                continue;
            }

            const usageMatch = /^(\d+)\/(\d+)$/.exec(part);
            if (!usageMatch) {
                return null;
            }

            const used = parseInt(usageMatch[1]);
            const total = parseInt(usageMatch[2]);
            if (isNaN(used) || isNaN(total)) {
                return null;
            }
            available += Math.max(0, total - used);
            matched = true;
        }

        return matched ? available : null;
    }
}

function splitGresList(gresListRaw: string): string[] {
    if (!gresListRaw || gresListRaw === '(null)' || gresListRaw === 'N/A') {
        return [];
    }

    const parts: string[] = [];
    let depth = 0;
    let start = 0;

    for (let i = 0; i < gresListRaw.length; i++) {
        const char = gresListRaw[i];
        if (char === '(') {
            depth += 1;
        } else if (char === ')' && depth > 0) {
            depth -= 1;
        } else if (char === ',' && depth === 0) {
            parts.push(gresListRaw.slice(start, i).trim());
            start = i + 1;
        }
    }

    parts.push(gresListRaw.slice(start).trim());
    return parts.filter(v => v.length > 0);
}
