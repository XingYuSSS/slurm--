import { LogFile } from "./logFileModel";
import { Gres } from "./gresModel";


function parseFilename(
    pattern: string,
    jobid: number | string,
    name: string,
    user: string,
    node: string,
    stepid?: number,
): string {
    console.log(pattern)
    if (pattern.includes('\\')) { return pattern.replaceAll('\\', '') }
    const replacements: Record<string, string> = {
        '%A': `${jobid}`,  // Job array master job allocation number
        '%a': '%a',  // Job array index number, not implemented for now
        '%b': '%b',  // Job array index modulo 10, not implemented for now
        '%J': stepid ? `${jobid}.${stepid}` : `${jobid}`,  // jobid.stepid
        '%j': `${jobid}`,  // jobid
        '%N': `${node}`,  // short hostname
        '%n': '0',  // node identifier, not implemented for now
        '%s': stepid?.toString() ?? '%s',  // stepid
        '%t': '0',  // task identifier, not implemented for now
        '%u': user,  // user name
        '%x': name,  // job name
    };

    pattern = pattern.replace('%%', '\0');
    pattern = pattern.replace(/%([A-Za-z])/g, (match, p1) => replacements[`%${p1}`] ?? match);
    return pattern.replace('\0', '%');
}



export enum TaskState {
    R = "RUNNING",
    PD = "PENDING",
    CG = "COMPLETING",
}

export class Task {
    readonly jobid: number;
    readonly name: string;
    readonly user: string;
    state: TaskState;
    readonly node: string;
    readonly gres: Gres | null;
    readonly limit_time: string;
    runing_time: string;
    readonly command: string;
    readonly out_path: LogFile;
    readonly err_path: LogFile;
    reason: string;
    finished: boolean;
    //JobID,Name:255,Username:20,State:20,NodeList,Gres:50,TimeLimit,TimeUsed,Command:255,STDOUT:255,STDERR:255,Reason:100
    constructor(jobid: string, name: string, user: string, state: string, node: string, gres: string, limit_time: string, runing_time: string, command: string, out_path: string, err_path: string, reason: string)
    constructor(jobid: number, name: string, user: string, state: string, node: string, gres: Gres | null, limit_time: string, runing_time: string, command: string, out_path: LogFile, err_path: LogFile, reason: string, finished: boolean)

    constructor(
        jobid: number | string,
        name: string,
        user: string,
        state: TaskState,
        node: string,
        gres: string | Gres | null,
        limit_time: string,
        runing_time: string,
        command: string,
        out_path: string | LogFile,
        err_path: string | LogFile,
        reason: string,
        finished?: boolean,
    ) {
        this.jobid = typeof jobid === "string" ? parseInt(jobid) : jobid;
        this.name = name;
        this.user = user;
        this.state = state;
        this.node = node;
        this.gres = typeof gres === "string" ? (gres === 'N/A' ? null : new Gres(gres)) : gres;
        this.limit_time = limit_time;
        this.runing_time = runing_time;
        this.command = command;
        this.out_path = typeof out_path === "string" ? new LogFile(parseFilename(out_path, jobid, name, user, node)) : out_path;
        this.err_path = typeof err_path === "string" ? new LogFile(parseFilename(err_path, jobid, name, user, node)) : err_path;
        this.reason = reason === 'None' ? '' : reason;
        this.finished = finished ?? false;
    }

    public static fromObject(obj: Task): Task {
        return new Task(
            obj.jobid,
            obj.name,
            obj.user,
            obj.state,
            obj.node,
            obj.gres,
            obj.limit_time,
            obj.runing_time,
            obj.command,
            obj.out_path,
            obj.err_path,
            obj.reason,
            obj.finished
        );
    }

    public update(task: Task) {
        this.state = task.state;
        this.runing_time = task.runing_time;
        this.reason = task.reason;
    }

    public finish() {
        this.finished = true;
    }

}