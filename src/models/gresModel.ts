// eslint-disable-next-line @typescript-eslint/naming-convention
import _ from "lodash";

export class Gres {
    readonly type: string;
    readonly name: string | null = null;
    readonly other: string | null = null;
    readonly num: number;
    constructor(gres: string) {
        const slicedGres = gres.replace(/^gres:/, '').replace(/\(.*\)$/, '').split(":");
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

    constructor(usedGres: string, totalGres: string) {
        super(totalGres);
        const used = new Gres(usedGres);
        this.usedNum = used.num;
        this.totalNum = this.num;
    }

    toString() {
        return this.type + (this.name ? ':' + this.name : '') + (this.other ? ':' + this.other : '') + ` (${this.totalNum - this.usedNum}/${this.totalNum})`;
    }

    is(rgres: ResourceGres): boolean {
        return rgres.type === this.type && rgres.name === this.name && rgres.other === this.other;
    }

    add(rgres: ResourceGres): ResourceGres {
        this.usedNum += rgres.usedNum;
        this.totalNum += rgres.totalNum;
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
}

