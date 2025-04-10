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
    if (pattern.includes('\\')) { return pattern.replaceAll('\\', ''); }
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

export type TaskProperties = {
    [K in keyof Task]: Task[K] extends LogFile ? string : Task[K];
};

export class Task {
    readonly jobid: number;
    readonly name: string;
    readonly user: string;
    state: TaskState;
    node: string;
    readonly gres: Gres | null;
    readonly limit_time: string;
    runing_time: string;
    readonly command: LogFile;
    readonly out_path: LogFile;
    readonly err_path: LogFile;
    reason: string;
    readonly submit_time: string;
    start_time: string | null;
    end_time: string | null;

    finished: boolean;

    //JobID,Name:255,Username:20,State:20,NodeList,Gres:50,TimeLimit,TimeUsed,Command:255,STDOUT:255,STDERR:255,Reason:100
    constructor(jobid: string, name: string, user: string, state: string, node: string, gres: string, limit_time: string, runing_time: string, command: string, out_path: string, err_path: string, reason: string, submit_time: string, start_time: string, end_time: string)
    constructor(jobid: number, name: string, user: string, state: string, node: string, gres: Gres | null, limit_time: string, runing_time: string, command: LogFile, out_path: LogFile, err_path: LogFile, reason: string, submit_time: string, start_time: string | null, end_time: string | null, finished: boolean)

    constructor(
        jobid: number | string,
        name: string,
        user: string,
        state: TaskState,
        node: string,
        gres: string | Gres | null,
        limit_time: string,
        runing_time: string,
        command: string | LogFile,
        out_path: string | LogFile,
        err_path: string | LogFile,
        reason: string,
        submit_time: string,
        start_time: string | null,
        end_time: string | null,
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
        this.command = typeof command === "string" ? new LogFile(command) : command;
        this.out_path = typeof out_path === "string" ? new LogFile(parseFilename(out_path, jobid, name, user, node)) : out_path;
        this.err_path = typeof err_path === "string" ? new LogFile(parseFilename(err_path, jobid, name, user, node)) : err_path;
        this.reason = reason === 'None' ? '' : reason;
        this.submit_time = submit_time;
        this.start_time = start_time === 'N/A' ? null : start_time;
        this.end_time = end_time === 'N/A' ? null : end_time;

        this.finished = finished ?? false;
    }

    public static fromObject(obj: TaskProperties): Task {
        return new Task(
            obj.jobid,
            obj.name,
            obj.user,
            obj.state,
            obj.node,
            obj.gres,
            obj.limit_time,
            obj.runing_time,
            new LogFile(obj.command),
            new LogFile(obj.out_path),
            new LogFile(obj.err_path),
            obj.reason,
            obj.submit_time,
            obj.start_time,
            obj.end_time,
            obj.finished
        );
    }

    public update(task: Task) {
        this.state = task.state;
        this.node = task.node;
        this.runing_time = task.runing_time;
        this.reason = task.reason;
        this.start_time = task.start_time;
        this.end_time = task.end_time;
    }

    public finish(end_time: string) {
        this.end_time = end_time;
        this.finished = true;
    }

}