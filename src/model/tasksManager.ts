import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { Task } from './taskModel';
import { Gres } from './gresModel';
import { LogFile } from './logFileModel';


export class TaskManager {
    private storagePath;
    private taskMap!: Map<number, Task>;
    private initing: boolean = true;

    private static _instance: TaskManager | null = null;
    private constructor(context: vscode.ExtensionContext) {
        this.storagePath = path.join(context.globalStorageUri.fsPath, 'tasks.json');
        const dir = path.dirname(this.storagePath);
        fs.mkdirSync(dir, { recursive: true });
        this.load_task();
    }

    static getInstance(context?: vscode.ExtensionContext): TaskManager {
        if (TaskManager._instance === null) {
            if (context === undefined) {
                throw new Error(`init ${this.name} failed.`);
            }
            TaskManager._instance = new TaskManager(context);
        }
        return TaskManager._instance;
    }

    private load_task() {
        if (fs.existsSync(this.storagePath)) {
            const jsonData = fs.readFileSync(this.storagePath, 'utf8');
            const saveMap = JSON.parse(jsonData);
            this.taskMap = new Map(saveMap);
            this.taskMap.forEach((v, k) => this.taskMap.set(k, Task.fromObject(v)));
        } else {
            this.taskMap = new Map();
        }
    }

    private save_task() {
        const arrData = Array.from(this.taskMap.entries());
        const jsonData = JSON.stringify(arrData, (k, v)=>{
            if (k === 'gres') {
                return Gres.prototype.toString.call(v);
            }
            if (k === 'out_path' || k === 'err_path') {
                return LogFile.prototype.toString.call(v);
            }
            return v;
        });
        fs.writeFile(this.storagePath, jsonData, 'utf8', () => { });
        
    }

    public addTask(...tasks: Task[]) {
        tasks.forEach(value => this.taskMap.set(value.jobid, value));
    }

    public updateTask(...tasks: Task[]) {
        const newId = tasks.map(value => value.jobid);
        const oldId = [...this.taskMap.keys()];

        const updateId = newId.filter(value => oldId.includes(value));
        const addId = newId.filter(value => !updateId.includes(value));
        const dropId = oldId.filter(value => !updateId.includes(value));


        this.addTask(...tasks.filter(value => addId.includes(value.jobid)));
        tasks.filter(value => updateId.includes(value.jobid))
            .forEach(value => this.taskMap.get(value.jobid)?.update(value));
        dropId.forEach(v => this.taskMap.get(v)?.finish());

        this.save_task();
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

    public getTask(): Task[] {
        return [...this.taskMap.values()];
    }

}

export let taskManager: TaskManager;

export function initTaskManager(context: vscode.ExtensionContext) {
    taskManager = TaskManager.getInstance(context);
}
