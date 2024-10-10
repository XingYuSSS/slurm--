import { LogFile } from "./logFileModel";
import { Gres } from "./gresModel";


export class Node {
    readonly memory: number;
    allocMemory: number;
    readonly gres: Gres;
    usedGres: Gres;
    //NODELIST:15,Available:15,Memory:15,AllocMem:15,Gres:50,GresUsed:50,Partition:15
    constructor(nodeid: string, available: string, memory: string, allocMemory: string, gres: string, usedGres: string, partition: string)
    constructor(nodeid: string, available: string, memory: number, allocMemory: number, gres: Gres, usedGres: Gres, partition: string)

    constructor(
        readonly nodeid: string,
        public available: string,
        memory: string | number,
        allocMemory: string | number,
        gres: string | Gres,
        usedGres: string | Gres,
        readonly partition: string,
    ) {
        this.memory = typeof memory === "string" ? parseInt(memory) : memory;
        this.allocMemory = typeof allocMemory === "string" ? parseInt(allocMemory) : allocMemory;
        this.gres = typeof gres === "string" ? new Gres(gres) : gres;
        this.usedGres = typeof usedGres === "string" ? new Gres(usedGres) : usedGres;
    }

    public update(node: Node) {
        this.allocMemory = node.allocMemory;
        this.usedGres = node.usedGres;
        this.available = node.available;
    }

}