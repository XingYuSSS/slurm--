import { LogFile } from "../logFileModel";
import { Gres } from "../gresModel";
import { BaseTask, TaskState } from "./baseTask";
import { convertKeysToCamelCase } from "../../utils/utils";


export interface TaskParams {
    jobid: number | string;
    arrayid: number | string | null;
    name: string;
    user: string;
    state: TaskState;
    node: string;
    gres: string | Gres | null;
    limitTime: string;
    runningTime: string;
    command: string | LogFile;
    outPath: string | LogFile;
    errPath: string | LogFile;
    reason: string;
    submitTime: string;
    startTime?: string | null;
    endTime?: string | null;
    finished?: boolean;
}

type ObjWithType<T, TType extends string> = {
    type: TType;
} & {
    [K in keyof T]:
    string extends T[K] ? string :
    T[K] extends string ? string :
    boolean extends T[K] ? boolean :
    number extends T[K] ? number :
    string
};

export type TaskObj = ObjWithType<TaskParams, 'Task'>

export class Task implements BaseTask {
    readonly jobid: number;
    readonly arrayid: number | null;
    readonly jobArrayId: string;
    readonly name: string;
    readonly user: string;
    state: TaskState;
    node: string;
    readonly gres: Gres | null;
    readonly limitTime: string;
    runningTime: string;
    readonly command: LogFile;
    readonly outPath: LogFile;
    readonly errPath: LogFile;
    reason: string;
    readonly submitTime: string;
    startTime: string | null;
    endTime: string | null;

    finished: boolean;

    constructor(
        params: TaskParams
    ) {
        this.jobid = typeof params.jobid === "string" ? parseInt(params.jobid) : params.jobid;
        this.arrayid = typeof params.arrayid === "string" ? (params.arrayid === 'N/A' ? null : parseInt(params.arrayid)) : (params.arrayid ?? null);
        this.jobArrayId = `${this.jobid}${this.arrayid !== null ? `_${this.arrayid}` : ''}`;
        this.name = params.name;
        this.user = params.user;
        this.state = params.state;
        this.node = params.node;
        this.gres = typeof params.gres === "string" ? (params.gres === 'N/A' ? null : new Gres(params.gres)) : (params.gres ?? null);
        this.limitTime = params.limitTime;
        this.runningTime = params.runningTime;
        this.command = typeof params.command === "string" ? new LogFile(params.command) : params.command;
        this.outPath = typeof params.outPath === "string" ? new LogFile(Task.parseFilename(params.outPath, params)) : params.outPath;
        this.errPath = typeof params.errPath === "string" ? new LogFile(Task.parseFilename(params.errPath, params)) : params.errPath;
        this.reason = params.reason === 'None' ? '' : params.reason;
        this.submitTime = params.submitTime;
        this.startTime = params.startTime === 'N/A' || !params.startTime ? null : params.startTime;
        this.endTime = params.endTime === 'N/A' || !params.endTime ? null : params.endTime;

        this.finished = params.finished ?? false;
    }

    private static parseFilename(
        pattern: string,
        param: TaskParams & { stepid?: number | string }
    ): string {
        if (pattern.includes('\\')) { return pattern.replaceAll('\\', ''); }
        const replacements: Record<string, string> = {
            '%A': `${param.jobid}`,  // Job array master job allocation number
            '%a': param.arrayid?.toString() ?? '4294967294',  // Job array index number
            // '%b': param.arrayid?.toString().slice(0, -1) ?? '%b',  // Job array index modulo 10
            '%J': param.stepid ? `${param.jobid}.${param.stepid}` : `${param.jobid}`,  // jobid.stepid
            '%j': `${param.jobid}`,  // jobid
            '%N': `${param.node}`,  // short hostname
            '%n': '0',  // node identifier, not implemented for now
            '%s': param.stepid?.toString() ?? '%s',  // stepid
            '%t': '0',  // task identifier, not implemented for now
            '%u': param.user,  // user name
            '%x': param.name,  // job name
        };

        pattern = pattern.replace('%%', '\0');
        pattern = pattern.replace(/%([A-Za-z])/g, (match, p1) => replacements[`%${p1}`] ?? match);
        return pattern.replace('\0', '%');
    }

    public update(task: Task) {
        this.state = task.state;
        this.node = task.node;
        this.runningTime = task.runningTime;
        this.reason = task.reason;
        this.startTime = task.startTime;
        this.endTime = task.endTime;
    }

    public finish(endTime: string) {
        this.node = '';
        this.reason = '';
        this.state = TaskState.CG;
        this.endTime = endTime;
        this.finished = true;
    }

    public toObj(): TaskObj {
        const result: Record<string, string | boolean | number> = { type: 'Task' };

        for (const key of Object.keys(this)) {
            const value = (this as any)[key];
            switch (key) {
                case 'gres':
                    result[key] = value?.toString() ?? 'N/A';
                    break;

                case 'outPath':
                case 'errPath':
                    result[key] = value.toString();
                    break;

                case 'startTime':
                case 'endTime':
                    result[key] = value ?? 'N/A';
                    break;

                default:
                    result[key] = value;
            }

        }

        return result as TaskObj;
    }

    static fromObj(obj: TaskObj) {
        obj = convertKeysToCamelCase(obj) as TaskObj;
        return new Task(obj as TaskParams);
    }

}
