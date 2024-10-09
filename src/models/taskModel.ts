import { LogFile } from "./logFileModel";
import { Gres } from "./gresModel";


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
    readonly gres: Gres;
    readonly limit_time: string;
    runing_time: string;
    readonly command: string;
    readonly out_path: LogFile;
    readonly err_path: LogFile;
    reason: string;
    finished: boolean;
    //JobID,Name:255,Username:20,State:20,NodeList,Gres:50,TimeLimit,TimeUsed,Command:255,STDOUT:255,STDERR:255,Reason:100
    constructor(jobid: string, name: string, user: string, state: string, node: string, gres: string, limit_time: string, runing_time: string, command: string, out_path: string, err_path: string, reason: string)
    constructor(jobid: number, name: string, user: string, state: string, node: string, gres: Gres, limit_time: string, runing_time: string, command: string, out_path: LogFile, err_path: LogFile, reason: string, finished: boolean)

    constructor(
        jobid: number | string,
        name: string,
        user: string,
        state: TaskState,
        node: string,
        gres: string | Gres,
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
        this.gres = typeof gres === "string" ? new Gres(gres) : gres;
        this.limit_time = limit_time;
        this.runing_time = runing_time;
        this.command = command;
        this.out_path = typeof out_path === "string" ? new LogFile(out_path.replace('%j', jobid.toString())) : out_path;
        this.err_path = typeof err_path === "string" ? new LogFile(err_path.replace('%j', jobid.toString())) : err_path;
        this.reason = reason === 'None' ? '' : reason;
        this.finished = finished??false;
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