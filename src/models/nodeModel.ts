import { ResourceGres } from "./gresModel";

export enum NodeState {
    DOWN = "down",
    MIXED = "mixed",
    IDLE = "idle",
    DRAIN = "drain",
    ALLOC = "alloc"
}

export class Node {
    readonly memory: number;
    allocMemory: number;
    readonly gres: ResourceGres | null;
    readonly partition: string;
    readonly state: NodeState;

    //NODELIST:15,Available:15,Memory:15,AllocMem:15,Gres:50,GresUsed:50,Partition:15,StateLong:15
    constructor(nodeid: string, available: string, memory: string, allocMemory: string, gres: string, usedGres: string, partition: string, state: string)
    constructor(
        readonly nodeid: string,
        public available: string,
        memory: string,
        allocMemory: string,
        gres: string,
        usedGres: string,
        partition: string,
        state: string,
    ) {
        this.memory = (typeof memory === "string" ? parseInt(memory) : memory) / 1000;
        this.allocMemory = (typeof allocMemory === "string" ? parseInt(allocMemory) : allocMemory) / 1000;
        this.gres = gres === '(null)' ? null : new ResourceGres(usedGres, gres);
        this.partition = partition.endsWith('*') ? partition.slice(0, partition.length - 1) : partition;
        this.state = (state.endsWith('*') ? state.slice(0, state.length - 1) : state) as NodeState;
    }

    get isAvailableState(): boolean { return this.state === NodeState.MIXED || this.state === NodeState.IDLE; }

}