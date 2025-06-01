
export enum TaskState {
    R = "RUNNING",
    PD = "PENDING",
    CG = "COMPLETING",
}

export interface BaseTask {
    readonly jobid: number;
    readonly jobArrayId: string | string[];
    readonly arrayid?: number | null;
    readonly name: string;
    state: TaskState;

    finished: boolean;

    update(task: this): void;
    finish(endTime: string | Record<number, string>): void;
    toObj(): Object;
}
