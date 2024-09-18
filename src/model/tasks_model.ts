import * as vscode from 'vscode';

export enum TaskState {
    R = "RUNNING",
    PD = "PENDING"
}


export class Gres {
    type: string;
    name: string | null = null;
    other: string | null = null;
    num: number;
    constructor(gres: string) {
        const slicedGres = (gres.startsWith('gres:') ? gres.substring(5) : gres).split(":");
        this.type = slicedGres[0];
        this.name = slicedGres.length > 2 ? slicedGres[1] : null;
        this.other = slicedGres.length > 3 ? slicedGres.slice(2, -1).join(":") : null;
        this.num = parseInt(slicedGres[slicedGres.length - 1]);
    }

    toString() {
        return this.type + (this.name ? ':' + this.name : '') + (this.other ? ':' + this.other : '') + ':' + this.num.toString();
    }
}


export class Task {
    jobid: number;
    name: string;
    user: string;
    state: TaskState;
    node: string;
    gres: Gres;
    limit_time: string;
    runing_time: string;
    command: string;
    out_path: string;
    err_path: string;
    reason: string;
    //JobID,Name:255,Username:20,State:20,NodeList,Gres:50,TimeLimit,TimeUsed,Command:255,STDOUT:255,STDERR:255,Reason:100
    constructor(jobid: string, name: string, user: string, state: string, node: string, gres: string, limit_time: string, runing_time: string, command: string, out_path: string, err_path: string, reason: string)

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
        out_path: string,
        err_path: string,
        reason: string
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
        this.out_path = out_path;
        this.err_path = err_path;
        this.reason = reason === 'None' ? '' : reason;
    }

    public update(task: Task) {
        this.state = task.state;
        this.runing_time = task.runing_time;
        this.reason = task.reason;
    }

}

export class TaskManager {
    private static _instance: TaskManager | null = null;
    private constructor() { }

    static getInstance() {
        if (TaskManager._instance === null) {
            TaskManager._instance = new TaskManager();
        }
        return TaskManager._instance;
    }

    private taskMap: Map<number, Task> = new Map();

    public addTask(...tasks: Task[]) {
        tasks.forEach(value => this.taskMap.set(value.jobid, value));
    }

    public updateTask(...tasks: Task[]) {
        const newId = tasks.map(value => value.jobid);
        const oldId = [...this.taskMap.keys()];

        const updateId = newId.filter(value => oldId.includes(value));
        const addId = newId.filter(value => !updateId.includes(value));
        const dropId = oldId.filter(value => !updateId.includes(value));

        dropId.forEach(value => this.taskMap.delete(value));
        this.addTask(...tasks.filter(value => addId.includes(value.jobid)));
        tasks.filter(value => updateId.includes(value.jobid))
            .forEach(value => this.taskMap.get(value.jobid)?.update(value));
    }

    public deleteTask(...tasks: number[]): void;
    public deleteTask(...tasks: Task[]): void;
    public deleteTask(...tasks: Task[] | number[]): void {
        if (tasks.length === 0) {
            return;
        }
        if (typeof tasks[0] === "number") {
            tasks.forEach(value => this.taskMap.delete(value as number));
        } else {
            tasks.forEach(value => this.taskMap.delete((value as Task).jobid));
        }
    }

    public getTask(name?: string): Task[] {
        if (name === undefined) {
            return [...this.taskMap.values()];
        } else {
            return [...this.taskMap.values()].filter((value) => { value.name === name; });
        }
    }
}

export const taskManager = TaskManager.getInstance();
