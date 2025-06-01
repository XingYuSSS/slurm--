import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { BaseTask, loadObj, TaskArray, TaskObjTypes } from '../models';
import { executeCmd } from '../utils/utils';


async function getFinishTime(taskId: string[]): Promise<Map<string, string>> {
    if (taskId.length === 0) { return new Map(); }

    const [out, err] = await executeCmd(`sacct --array -n -X -P -j ${taskId.join(',')} --format=JobID,End`);
    if (err) {
        vscode.window.showErrorMessage(err);
        return new Map();
    }
    const lines = out.split('\n');

    const finishTimes: Map<string, string> = new Map();
    lines.forEach(line => {
        const [jobid, time] = line.split('|');
        if (time !== 'Unknown') {
            finishTimes.set(jobid, time);
        }
    });
    return finishTimes;
}


export class TaskService {
    private storagePath;
    private taskMap!: Map<number, BaseTask>;

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
            const taskMap = new Map(saveMap) as Map<number, TaskObjTypes>;

            taskMap.forEach((v, k) => this.taskMap.set(k, loadObj(v)));
        }
    }

    private async saveTask() {
        const arrData = Array.from(this.taskMap.entries()).map(([key, task]) => ([
            key,
            task.toObj()
        ]));
        const jsonData = JSON.stringify(arrData);
        fs.writeFileSync(this.storagePath, jsonData, 'utf8');
    }

    private async finishTask(taskId: string[]) {
        if (taskId.length === 0) { return; }
        const endmap = await getFinishTime(taskId);
        endmap.forEach((v, k) => {
            const [jobid, arrid] = k.split('_');
            this.taskMap.get(parseInt(jobid))?.finish(arrid !== undefined ? { [arrid]: v } : v);
        });
    }

    public addTask(...tasks: BaseTask[]) {
        tasks.forEach(value => this.taskMap.set(value.jobid, value));
        this.saveTask();
    }

    public async updateTask(...tasks: BaseTask[]) {
        this.loadTask();
        const newId = tasks.map(value => value.jobid);
        const oldId = [...this.taskMap.values()].filter(v => !v.finished).map(v => v.jobid);

        const updateId = newId.filter(value => oldId.includes(value));
        const addId = newId.filter(value => !updateId.includes(value));

        tasks.filter(value => addId.includes(value.jobid))
            .forEach(value => this.taskMap.set(value.jobid, value));
        tasks.filter(value => updateId.includes(value.jobid))
            .forEach(value => this.taskMap.get(value.jobid)?.update(value));

        const newArrId = tasks.map(value => value.jobArrayId).flat();
        const oldArrId = [...this.taskMap.values()].filter(v => !v.finished).map(v => v.jobArrayId).flat();

        const updateArrId = newArrId.filter(value => oldArrId.includes(value));
        const dropArrId = oldArrId.filter(value => !updateArrId.includes(value));

        await this.finishTask(dropArrId);

        this.saveTask();
    }

    public deleteTask(task: BaseTask | number, arrayId?: number | null): void {
        const taskId = typeof task === "number" ? task : task.jobid;
        if (arrayId === undefined || arrayId === null) {
            this.taskMap.delete(taskId);
        } else {
            delete (this.taskMap.get(taskId) as TaskArray).subTasks[arrayId];
        }
        this.saveTask();
    }

    public getTask(): BaseTask[] {
        return [...this.taskMap.values()];
    }

}

export let taskService: TaskService;

export function initTaskService(context: vscode.ExtensionContext) {
    taskService = TaskService.getInstance(context);
}
