import * as vscode from 'vscode';

export enum TaskState {
    R = "RUNNING",
    PD = "PENDING"
}



export class Task {
    jobid: number;
    name: string;
    user: string;
    state: TaskState;
    node: string;
    gres: string;
    limit_time:string;
    runing_time: string;
    command: string;
    out_path: string;
    err_path: string;
    reason: string;
    //JobID,Name:255,Username:20,State:20,NodeList,Gres:50,TimeLimit,TimeUsed,Command:255,STDOUT:255,STDERR:255,Reason:100
    constructor(jobid: string, name: string, user: string, state: string, node: string, gres: string, limit_time:string, runing_time: string, command: string, out_path: string, err_path: string, reason: string)
    // constructor(jobid: number, name: string, user: string, status: string, runing_time: Date, node_or_reason: string)
    // constructor(jobid: number, name: string, user: string, status: TaskStatus, runing_time: Date, node_or_reason: string)

    constructor(
        jobid: number | string,
        name: string,
        user: string,
        state: TaskState | string,
        node: string,
        gres: string,
        limit_time:string,
        runing_time: string,
        command: string,
        out_path: string,
        err_path: string,
        reason: string
    ) {
        if (typeof jobid === "string") {
            this.jobid = parseInt(jobid);
        } else {
            this.jobid = jobid;
        }
        this.name = name;
        this.user = user;
        if (typeof state === "string") {
            this.state = TaskState[state as keyof typeof TaskState];
        } else {
            this.state = state;
        }
        // if (typeof runing_time === "string") {
        //     this.runing_time = parseInt(jobid);
        // } else {
        //     this.runing_time = runing_time;
        // }
        this.node = node;
        this.gres = gres;
        this.limit_time = limit_time;
        this.runing_time = runing_time;
        this.command = command;
        this.out_path = out_path;
        this.err_path = err_path;
        this.reason = reason;
        
    }

    markdownDescription(): vscode.MarkdownString {
        return new vscode.MarkdownString(`
| id | name | user | status | time | node(reason) |
|:--:|:--:|:--:|:--:|:--:|:--:|
| ${this.jobid} | ${this.name} | ${this.user} | ${this.state} | ${this.runing_time} | ${this.node} |
        `);
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

        const addId = newId.filter(value => !oldId.includes(value));
        const dropId = oldId.filter(value => !newId.includes(value));

        dropId.forEach(value => this.taskMap.delete(value));
        this.addTask(...tasks.filter(value => addId.includes(value.jobid)));
    }

    public deleteTask(...tasks: number[]): void;
    public deleteTask(...tasks: Task[]): void;
    public deleteTask(...tasks: Task[]|number[]): void {
        if (tasks.length === 0) {
            return;
        }
        if ( typeof tasks[0] === "number" ) {
            tasks.forEach(value=>this.taskMap.delete(value as number));
        } else {
            tasks.forEach(value=>this.taskMap.delete((value as Task).jobid));
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
