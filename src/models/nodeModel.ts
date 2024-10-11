import { LogFile } from "./logFileModel";
import { Gres, ResourceGres } from "./gresModel";


export class Node {
    readonly memory: number;
    allocMemory: number;
    readonly gres: ResourceGres;
    //NODELIST:15,Available:15,Memory:15,AllocMem:15,Gres:50,GresUsed:50,Partition:15
    constructor(nodeid: string, available: string, memory: string, allocMemory: string, gres: string, usedGres: string, partition: string)

    constructor(
        readonly nodeid: string,
        public available: string,
        memory: string,
        allocMemory: string,
        gres: string,
        usedGres: string,
        readonly partition: string,
    ) {
        this.memory = (typeof memory === "string" ? parseInt(memory) : memory)/1000;
        this.allocMemory = (typeof allocMemory === "string" ? parseInt(allocMemory) : allocMemory)/1000;
        this.gres = new ResourceGres(usedGres, gres);
    }

}