import { ResourceGres } from "./gresModel";

export enum NodeState {
    DOWN = "down",
    MIXED = "mixed",
    IDLE = "idle",
    DRAIN = "drain",
    ALLOC = "alloc"
}

export interface NodeParam {
    nodeid: string,
    available: string,
    memory: string,
    allocMemory: string,
    gres: string,
    usedGres: string,
    partition: string,
    state: string,
    cpuState: string,
}

export class Node {
    readonly nodeid: string;
    public available: string;
    readonly memory: number;
    allocMemory: number;
    readonly gres: ResourceGres | null;
    readonly partition: string;
    readonly state: NodeState;
    readonly cpu: number;
    public allocCpu: number;
    public idleCpu: number;
    public otherCpu: number;

    //NODELIST:15,Available:15,Memory:15,AllocMem:15,Gres:50,GresUsed:50,Partition:15,StateLong:15
    constructor(
        param: NodeParam
    ) {
        this.nodeid = param.nodeid;
        this.available = param.available;
        this.memory = (typeof param.memory === "string" ? parseInt(param.memory) : param.memory) / 1000;
        this.allocMemory = (typeof param.allocMemory === "string" ? parseInt(param.allocMemory) : param.allocMemory) / 1000;
        this.gres = param.gres === '(null)' ? null : new ResourceGres(param.usedGres, param.gres);
        this.partition = param.partition.endsWith('*') ? param.partition.slice(0, -1) : param.partition;
        this.state = (param.state.endsWith('*') ? param.state.slice(0, -1) : param.state) as NodeState;
        [this.allocCpu, this.idleCpu, this.otherCpu, this.cpu] = param.cpuState.split('/').map(v => parseInt(v));
    }

    get isAvailableState(): boolean { return this.state === NodeState.MIXED || this.state === NodeState.IDLE; }

}