import * as vscode from 'vscode';

import { AsyncOnce, executeCmd } from '../utils/utils';
import { LogFile, Task } from '../models';
import { taskService, configService } from '../services';
import * as taskView from '../view/taskView';
import { LogFileItem, TaskItem } from '../view/components';
import * as path from 'path';

let autoRefreshTimer: NodeJS.Timeout;

const fieldMap = new Map([
    ["JobID", 20],
    ["Name", 100],
    ["Username", 50],
    ["State", 20],
    ["NodeList", 50],
    ["Gres", 50],
    ["TimeLimit", 20],
    ["TimeUsed", 20],
    ["Command", 255],
    ["STDOUT", 255],
    ["STDERR", 255],
    ["Reason", 50],
    ["SubmitTime", 20],
    ["StartTime", 20],
    ["EndTime", 20],
]);

let cachePath: string;

function extractTask(taskString: string): Task[] {
    let slices = Array.from(fieldMap.values());
    slices.reduce((arr, currentValue, currentIndex) => {
        if (currentIndex > 0) {
            slices[currentIndex] = slices[currentIndex - 1] + currentValue;
        }
        return slices[currentIndex - 1] + currentValue;
    }, 0);
    slices.unshift(0);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8');
    let taskList: Task[] = [];
    taskString.split('\n').forEach((value) => {
        // JobID:20,Name:100,Username:50,State:20,NodeList:50,Gres:50,TimeLimit:20,TimeUsed:20,Command:255,STDOUT:255,STDERR:255,Reason:50,SubmitTime:20,StartTime:20,EndTime:20
        if (value.length === 0) { return; }

        const encodedValue = encoder.encode(value);
        let fields: string[] = slices.slice(1).reduce((arr: string[], v, i) => {
            arr.push(decoder.decode(encodedValue.slice(slices[i], v)).trim());
            return arr;
        }, []);
        const task = new Task(fields[0], fields[1], fields[2], fields[3], fields[4], fields[5], fields[6], fields[7], fields[8], fields[9], fields[10], fields[11], fields[12], fields[13], fields[14]);
        taskList.push(task);
    });
    return taskList;
}

async function refreshUserTasks() {
    const user = configService.optionUser;
    if (user === '') {
        const result = await vscode.window.showWarningMessage(
            vscode.l10n.t(`You didn't set user option, this will show ALL tasks in your system, continue?`),
            vscode.l10n.t('Yes'),
            vscode.l10n.t('Open settings'),
            vscode.l10n.t('No')
        );
        if (result === vscode.l10n.t('Open settings')) {
            vscode.commands.executeCommand('slurm--.openConfig');
            return;
        } else if (result === vscode.l10n.t('No')) {
            return;
        }
    }
    const query = Array.from(fieldMap.entries()).map(([key, value]) => `${key}:${value}`).join(',');
    const [out, err] = await executeCmd(`squeue ${user} --noheader -O ${query}`, cachePath, configService.taskCacheTimeout);
    if (err) {
        vscode.window.showErrorMessage(err);
        return;
    }
    await taskService.updateTask(...extractTask(out));
    taskView.taskViewDataProvider.refresh();
}


async function cancelTask(task: TaskItem) {
    const result = await vscode.window.showWarningMessage(
        vscode.l10n.t(`Cancel task named {0}?`, task.task.name),
        vscode.l10n.t('Yes'),
        vscode.l10n.t('No')
    );
    if (result === vscode.l10n.t('Yes')) {
        const [out, err] = await executeCmd(`scancel ${task.task.jobid}`);
        if (err) {
            vscode.window.showErrorMessage(err);
            return;
        }
        taskService.deleteTask(task.task.jobid);
        taskView.taskViewDataProvider.refresh();
    }
}

async function cancelSelectedTasks() {
    if (taskView.selectedTaskItems.length === 0) { return; }
    const tasks = taskView.selectedTaskItems.map(v => v.task);
    const result = await vscode.window.showWarningMessage(
        vscode.l10n.t(`This will cancel {0} tasks below: `, tasks.length) + tasks.map(v => v.name).join('; '),
        vscode.l10n.t('Yes'),
        vscode.l10n.t('No')
    );
    if (result === vscode.l10n.t('Yes')) {
        tasks.forEach(v => {
            executeCmd(`scancel ${v.jobid}`);
            taskService.deleteTask(v.jobid);
        });
        taskView.taskViewDataProvider.refresh();
    } else if (result === vscode.l10n.t('No')) {
    }
}

async function cancelAllTasks() {
    const tasks = taskService.getTask().filter(v => !v.finished);
    const result = await vscode.window.showWarningMessage(
        vscode.l10n.t(`This will cancel all {0} tasks below (unscaned tasks will not be canceled): `, tasks.length) + tasks.map(v => v.name).join('; '),
        vscode.l10n.t('Yes'),
        vscode.l10n.t('No')
    );
    if (result === vscode.l10n.t('Yes')) {
        tasks.forEach(v => {
            executeCmd(`scancel ${v.jobid}`);
            taskService.deleteTask(v.jobid);
        });
        taskView.taskViewDataProvider.refresh();
    } else if (result === vscode.l10n.t('No')) {
    }
}

async function autoRefreshTask() {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(() => {
        vscode.commands.executeCommand('slurm--.refreshUserTasks');
    }, configService.taskRefreshInterval_ms);
    vscode.commands.executeCommand('setContext', 'autoRefreshingTask', true);
}

async function unautoRefreshTask() {
    clearInterval(autoRefreshTimer);
    vscode.commands.executeCommand('setContext', 'autoRefreshingTask', false);
}

async function confirmTask(task: TaskItem) {
    if (task.task.finished) {
        taskService.deleteTask(task.task);
        taskView.taskViewDataProvider.refresh();
    }
}

async function confirmAllTask() {
    taskService.deleteTask(...taskService.getTask().filter(v => v.finished));
    taskView.taskViewDataProvider.refresh();
}


async function openFile(file: LogFile) {
    file.open();
}

async function openStdout(task: TaskItem) {
    task.task.out_path.open();
}

async function openStderr(task: TaskItem) {
    task.task.err_path.open();
}


export function initTaskCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.refreshUserTasks', AsyncOnce(refreshUserTasks)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.cancelTask', cancelTask));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.cancelSelectedTasks', cancelSelectedTasks));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.cancelAllTasks', cancelAllTasks));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.autoRefreshTask', autoRefreshTask));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.unautoRefreshTask', unautoRefreshTask));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.confirmTask', confirmTask));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.confirmAllTask', confirmAllTask));

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.openFile', openFile));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.openStdout', openStdout));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.openStderr', openStderr));

    vscode.commands.executeCommand('setContext', 'autoRefreshingTask', false);
    vscode.commands.executeCommand('slurm--.refreshUserTasks');

    cachePath = path.join(context.globalStorageUri.fsPath, 'tasks_cache.json');
}


