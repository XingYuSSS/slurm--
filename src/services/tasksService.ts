import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { Task, Gres, LogFile, TaskProperties } from '../models';
import { executeCmd } from '../utils/utils';

async function getFinishTime(taskId: number[]): Promise<Map<number, string>> {
    if (taskId.length === 0) { return new Map(); }
    const jobid_len = 40;

    const taskIdStr = taskId.map((v) => String(v));
    const [out, err] = await executeCmd(`sacct -j ${taskId.join(',')} --format=JobID%${jobid_len},End%25`);
    if (err) {
        vscode.window.showErrorMessage(err);
        return new Map();
    }
    const lines = out.split('\n');

    const finishTimes: Map<number, string> = new Map();
    for (let j = 2; j < lines.length; j++) {
        const line = lines[j];
        const jobid = line.slice(0, jobid_len).trim();
        if (taskIdStr.includes(jobid)) {
            finishTimes.set(parseInt(jobid), line.slice(jobid_len + 1).trim());
        }
    }
    return finishTimes;
}

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
        this.taskMap = new Map();

        if (fs.existsSync(this.storagePath)) {
            const jsonData = fs.readFileSync(this.storagePath, 'utf8');
            const saveMap = JSON.parse(jsonData);
            const taskMap = new Map(saveMap) as Map<number, TaskProperties>;

            taskMap.forEach((v, k) => this.taskMap.set(k, Task.fromObject(v)));
        }
    }

    private async saveTask() {
        const arrData = Array.from(this.taskMap.entries());
        const jsonData = JSON.stringify(arrData, (k, v) => {
            if (k === 'gres') {
                if (v === null) { return 'N/A'; }
                return Gres.prototype.toString.call(v);
            }
            if (k === 'out_path' || k === 'err_path' || k === 'command') {
                return LogFile.prototype.toString.call(v);
            }
            return v;
        });
        fs.writeFileSync(this.storagePath, jsonData, 'utf8');
    }

    private async finishTask(taskId: number[]) {
        if (taskId.length === 0) { return; }
        const endmap = await getFinishTime(taskId);
        endmap.forEach((v, k) => this.taskMap.get(k)?.finish(v));
    }

    public addTask(...tasks: Task[]) {
        tasks.forEach(value => this.taskMap.set(value.jobid, value));
        this.saveTask();
    }

    public async updateTask(...tasks: Task[]) {
        this.loadTask();
        const newId = tasks.map(value => value.jobid);
        const oldId = [...this.taskMap.values()].filter(v => !v.finished).map(v => v.jobid);

        const updateId = newId.filter(value => oldId.includes(value));
        const addId = newId.filter(value => !updateId.includes(value));
        const dropId = oldId.filter(value => !updateId.includes(value));


        tasks.filter(value => addId.includes(value.jobid))
            .forEach(value => this.taskMap.set(value.jobid, value));
        tasks.filter(value => updateId.includes(value.jobid))
            .forEach(value => this.taskMap.get(value.jobid)?.update(value));
        await this.finishTask(dropId);

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

export function initTaskService(context: vscode.ExtensionContext) {
    taskService = TaskService.getInstance(context);
}
