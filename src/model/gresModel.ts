export class Gres {
    readonly type: string;
    readonly name: string | null = null;
    readonly other: string | null = null;
    readonly num: number;
    constructor(gres: string) {
        const slicedGres = (gres.startsWith('gres:') ? gres.substring(5) : gres).split(":");
        this.type = slicedGres[0];
        this.name = slicedGres.length > 2 ? slicedGres[1] : null;
        this.other = slicedGres.length > 3 ? slicedGres.slice(2, -1).join(":") : null;
        this.num = parseInt(slicedGres[slicedGres.length - 1]);
    }

    toString() {
        return this.type + (this.name ? ':' + this.name : '') + (this.other ? ':' + this.other : '') + ':' + this.num.toString();
    }
}