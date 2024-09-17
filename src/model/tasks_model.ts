import * as vscode from 'vscode';

export enum TaskStatus {
    R = "R",
    PD = "PD"
}

export class Task {
    jobid: number;
    name: string;
    user: string;
    status: TaskStatus;
    // start_time: Date;
    runing_time: string;
    node_or_reason: string;

    constructor(jobid: string, name: string, user: string, status: string, runing_time: string, node_or_reason: string)
    // constructor(jobid: number, name: string, user: string, status: string, runing_time: Date, node_or_reason: string)
    // constructor(jobid: number, name: string, user: string, status: TaskStatus, runing_time: Date, node_or_reason: string)

    constructor(
        jobid: number | string,
        name: string,
        user: string,
        status: TaskStatus | string,
        runing_time: string,
        node_or_reason: string,
    ) {
        if (typeof jobid === "string") {
            this.jobid = parseInt(jobid);
        } else {
            this.jobid = jobid;
        }
        this.name = name;
        this.user = user;
        if (typeof status === "string") {
            this.status = TaskStatus[status as keyof typeof TaskStatus];
        } else {
            this.status = status;
        }
        // if (typeof runing_time === "string") {
        //     this.runing_time = parseInt(jobid);
        // } else {
        //     this.runing_time = runing_time;
        // }
        this.runing_time = runing_time;
        this.node_or_reason = node_or_reason;
    }

    markdownDescription(): vscode.MarkdownString {
        return new vscode.MarkdownString(`
| id | name | user | status | time | node(reason) |
|:--:|:--:|:--:|:--:|:--:|:--:|
| ${this.jobid} | ${this.name} | ${this.user} | ${this.status} | ${this.runing_time} | ${this.node_or_reason} |
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

    public getTask(name?: string): Task[] {
        if (name === undefined) {
            return [...this.taskMap.values()];
        } else {
            return [...this.taskMap.values()].filter((value) => { value.name === name; });
        }
    }
}

export const taskManager = TaskManager.getInstance();
