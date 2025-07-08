export enum TaskState {
    R = "RUNNING",
    PD = "PENDING",
    CG = "COMPLETING",

    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
    TIMEOUT = "TIMEOUT",
    NODE_FAIL = "NODE_FAIL",
    OUT_OF_MEMORY = "OUT_OF_MEMORY"
}

export interface BaseTask {
    readonly jobid: number;
    readonly jobArrayId: string | string[];
    readonly arrayid?: number | null;
    readonly name: string;
    state: TaskState;

    finished: boolean;

    update(task: this): void;
    finish(endTime: string | Record<number, string>, exitCode: string | Record<number, string>, state: string | Record<number, string>): void;
    toObj(): Object;
}
