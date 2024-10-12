import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { Task, Gres, LogFile } from '../models';

export class TaskService {
    private storagePath;
    private taskMap!: Map<number, Task>;

    private static _instance: TaskService | null = null;
    private constructor(context: vscode.ExtensionContext) {
        this.storagePath = path.join(context.globalStorageUri.fsPath, 'tasks.json');
        const dir = path.dirname(this.storagePath);
        fs.mkdirSync(dir, { recursive: true });
        this.loadTask();
    }

    static getInstance(context?: vscode.ExtensionContext): TaskService {
        if (TaskService._instance === null) {
            if (context === undefined) {
                throw new Error(`init ${this.name} failed.`);
            }
            TaskService._instance = new TaskService(context);
        }
        return TaskService._instance;
    }

    private loadTask() {
        if (fs.existsSync(this.storagePath)) {
            const jsonData = fs.readFileSync(this.storagePath, 'utf8');
            const saveMap = JSON.parse(jsonData);
            this.taskMap = new Map(saveMap);
            this.taskMap.forEach((v, k) => this.taskMap.set(k, Task.fromObject(v)));
        } else {
            this.taskMap = new Map();
        }
    }

    private saveTask() {
        const arrData = Array.from(this.taskMap.entries());
        const jsonData = JSON.stringify(arrData, (k, v)=>{
            if (k === 'gres') {
                if (v === null) { return 'N/A'; }
                return Gres.prototype.toString.call(v);
            }
            if (k === 'out_path' || k === 'err_path') {
                return LogFile.prototype.toString.call(v);
            }
            return v;
        });
        fs.writeFileSync(this.storagePath, jsonData, 'utf8');
    }

    public addTask(...tasks: Task[]) {
        tasks.forEach(value => this.taskMap.set(value.jobid, value));
        this.saveTask();
    }

    public updateTask(...tasks: Task[]) {
        this.loadTask();
        const newId = tasks.map(value => value.jobid);
        const oldId = [...this.taskMap.keys()];

        const updateId = newId.filter(value => oldId.includes(value));
        const addId = newId.filter(value => !updateId.includes(value));
        const dropId = oldId.filter(value => !updateId.includes(value));


        tasks.filter(value => addId.includes(value.jobid))
            .forEach(value => this.taskMap.set(value.jobid, value));
        tasks.filter(value => updateId.includes(value.jobid))
            .forEach(value => this.taskMap.get(value.jobid)?.update(value));
        dropId.forEach(v => this.taskMap.get(v)?.finish());

        this.saveTask();
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
        this.saveTask();
    }

    public getTask(): Task[] {
        return [...this.taskMap.values()];
    }

}

export let taskService: TaskService;

export function initTaskManager(context: vscode.ExtensionContext) {
    taskService = TaskService.getInstance(context);
}
