import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { BaseTask, loadObj, TaskArray, TaskObjTypes, TaskState } from '../models';
import { executeCmd } from '../utils/utils';
import { configService } from './configService';
import { ensureSlurmCommand } from './commandAvailability';
import { clearQueryFailure, reportQuery } from './queryStatus';


function parseJobarrayId(jobIdStr: string): string[] {
    const fullJobMatch = /^(\d+)$/.exec(jobIdStr);
    if (fullJobMatch) {
        return [jobIdStr];
    }

    const singleTaskMatch = /^(\d+)_(\d+)$/.exec(jobIdStr);
    if (singleTaskMatch) {
        return [jobIdStr];
    }

    const bracketMatch = /^(\d+)_\[(.+?)(?:%\d+)?\]$/.exec(jobIdStr);
    if (bracketMatch) {
        const jobId = bracketMatch[1];
        const content = bracketMatch[2];

        const values = parseArrayTaskSpec(content);
        if (values.length > 0) {
            return values.map((v) => `${jobId}_${v}`);
        }
    }

    return [];
}

function parseArrayTaskSpec(content: string): number[] {
    const result: number[] = [];

    for (const part of content.split(',')) {
        const match = /^(\d+)(?:-(\d+)(?::(\d+))?)?$/.exec(part);
        if (!match) {
            return [];
        }

        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : start;
        const step = match[3] ? parseInt(match[3], 10) : 1;
        if (isNaN(start) || isNaN(end) || isNaN(step) || start > end || step <= 0) {
            return [];
        }

        for (let i = start; i <= end; i += step) {
            result.push(i);
        }
    }

    return result;
}

interface TaskFinishInfo {
    endTime: string;
    exitCode: string;
    state: string;
}

async function getTaskFinishInfo(taskId: string[], background: boolean): Promise<Map<string, TaskFinishInfo>> {
    if (taskId.length === 0) { clearQueryFailure('sacct'); return new Map(); }
    if (!await ensureSlurmCommand('sacct', background)) {
        reportQuery('sacct', vscode.l10n.t('Command unavailable.'), background, false);
        return new Map();
    }

    const { stdout: out, error: err } = await executeCmd(`${configService.getSlurmCommand('sacct')} -n -X -P -j ${taskId.join(',')} --format=JobID,End,ExitCode,State%30`);
    if (err) {
        reportQuery('sacct', err, background);
        return new Map();
    }
    const lines = out.split('\n');

    const finishInfoMap: Map<string, TaskFinishInfo> = new Map();
    const terminalStates = new Set(['COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT', 'NODE_FAIL', 'OUT_OF_MEMORY', 'BOOT_FAIL', 'DEADLINE', 'PREEMPTED', 'REVOKED']);
    lines.forEach(line => {
        const [jobid, time, exitCode, state] = line.split('|');
        const finalState = state?.trim().split(' ')[0];
        if (!time || time === 'Unknown' || !exitCode || !terminalStates.has(finalState)) { return; }
        const jobidList = parseJobarrayId(jobid);
        jobidList.forEach(jobid => {
            finishInfoMap.set(jobid, { endTime: time, exitCode, state: finalState });
        });
    });
    reportQuery('sacct');
    return finishInfoMap;
}


export class TaskService {
    private storagePath;
    private taskMap!: Map<number, BaseTask>;

    private isSaving = false;
    private pendingSave = false;

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
            try {
                let jsonData = fs.readFileSync(this.storagePath, 'utf8');
                if (jsonData === '') { jsonData = '[]'; }
                const saveMap = JSON.parse(jsonData);
                const taskMap = new Map(saveMap) as Map<number, TaskObjTypes>;

                taskMap.forEach((v, k) => {
                    const loaded = loadObj(v);
                    if (loaded !== null) {
                        this.taskMap.set(k, loaded);
                    }
                });
            } catch (err) {
                fs.unlinkSync(this.storagePath);
                vscode.window.showWarningMessage(vscode.l10n.t('The task cache file appears to be corrupted and has been automatically removed. Finished tasks may be lost.'));
            }
        }
    }

    private async saveTask() {
        if (this.isSaving) {
            this.pendingSave = true;
            return;
        }

        this.isSaving = true;
        try {
            const arrData = Array.from(this.taskMap.entries()).map(([key, task]) => ([
                key,
                task.toObj()
            ]));
            const jsonData = JSON.stringify(arrData);

            const tempPath = this.storagePath + '.tmp';
            fs.writeFileSync(tempPath, jsonData, 'utf8');

            fs.renameSync(tempPath, this.storagePath);
        } finally {
            this.isSaving = false;
            if (this.pendingSave) {
                this.pendingSave = false;
                this.saveTask();
            }
        }
    }

    private async finishTask(taskId: string[], background: boolean) {
        const finishInfoMap = await getTaskFinishInfo(taskId, background);
        finishInfoMap.forEach((info, jobArrayId) => {
            const [jobid, arrid] = jobArrayId.split('_');
            if (arrid !== undefined) {
                this.taskMap.get(parseInt(jobid))?.finish(
                    { [arrid]: info.endTime },
                    { [arrid]: info.exitCode },
                    { [arrid]: info.state }
                );
            } else {
                this.taskMap.get(parseInt(jobid))?.finish(info.endTime, info.exitCode, info.state);
            }
        });
    }

    public addTask(...tasks: BaseTask[]) {
        tasks.forEach(value => this.taskMap.set(value.jobid, value));
        this.saveTask();
    }

    public async updateTask(tasks: BaseTask[], background = false) {
        this.loadTask();
        const newId = tasks.map(value => value.jobid);
        const oldId = [...this.taskMap.keys()];

        const updateId = newId.filter(value => oldId.includes(value));
        const addId = newId.filter(value => !updateId.includes(value));

        tasks.filter(value => addId.includes(value.jobid))
            .forEach(value => this.taskMap.set(value.jobid, value));
        tasks.filter(value => updateId.includes(value.jobid))
            .forEach(value => this.taskMap.get(value.jobid)?.update(value));

        const newArrId = tasks.map(value => value.jobArrayId).flat();
        const oldArrId = [...this.taskMap.values()].map(v => v instanceof TaskArray ? v.getSubTasks() : v).flat().filter(v => !v.finished).map(v => v.jobArrayId) as string[];

        const updateArrId = newArrId.filter(value => oldArrId.includes(value));
        const dropArrId = oldArrId.filter(value => !updateArrId.includes(value));

        const missing = new Set(dropArrId);
        for (const task of this.taskMap.values()) {
            for (const subtask of task instanceof TaskArray ? task.getSubTasks() : [task]) {
                if (missing.has(subtask.jobArrayId as string)) {
                    subtask.state = TaskState.AWAITING_ACCOUNTING;
                }
            }
        }

        await this.finishTask(dropArrId, background);

        this.saveTask();
    }

    public deleteTask(task: BaseTask | number, arrayId?: number | null): void {
        const taskId = typeof task === "number" ? task : task.jobid;
        if (arrayId === undefined || arrayId === null) {
            this.taskMap.delete(taskId);
        } else {
            const array = this.taskMap.get(taskId) as TaskArray;
            delete array.subTasks[arrayId];
            if (Object.keys(array.subTasks).length === 0) {
                this.taskMap.delete(taskId);
            }
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
