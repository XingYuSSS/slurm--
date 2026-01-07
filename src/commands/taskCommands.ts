import * as vscode from 'vscode';
// eslint-disable-next-line @typescript-eslint/naming-convention
import _ from 'lodash';

import { AsyncOnce, executeCmd } from '../utils/utils';
import { BaseTask, LogFile, Task, TaskArray, TaskState } from '../models';
import { taskService, configService } from '../services';
import * as taskView from '../view/taskView';
import { LogFileItem, TaskArrayItem, TaskItem } from '../view/components';
import * as path from 'path';

let autoRefreshTimer: NodeJS.Timeout;

const fieldMap = new Map([
    ["ArrayJobID", 20],
    ["ArrayTaskID", 10],
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
const fieldNames = Array.from(fieldMap.keys());

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
        let fields: Record<string, string> = slices.slice(1).reduce((rec: Record<string, string>, v, i) => {
            rec[fieldNames[i]] = decoder.decode(encodedValue.slice(slices[i], v)).trim();
            return rec;
        }, {});

        const task = new Task({
            jobid: fields["ArrayJobID"],
            arrayid: fields["ArrayTaskID"],
            name: fields["Name"],
            user: fields["Username"],
            state: fields["State"] as TaskState,
            node: fields["NodeList"],
            gres: fields["Gres"],
            limitTime: fields["TimeLimit"],
            runningTime: fields["TimeUsed"],
            command: fields["Command"],
            outPath: fields["STDOUT"],
            errPath: fields["STDERR"],
            reason: fields["Reason"],
            submitTime: fields["SubmitTime"],
            startTime: fields["StartTime"],
            endTime: fields["EndTime"],
        });
        taskList.push(task);
    });
    return taskList;
}

function buildTaskArray(taskList: Task[]): BaseTask[] {
    const grouped = _.groupBy(taskList, 'jobid');
    return Object.values(grouped).map((v) => v[0].arrayid !== null ? new TaskArray(v) : v[0]);
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
    const [out, err] = await executeCmd(`squeue ${user} -r --noheader -O ${query}`, cachePath, configService.taskCacheTimeout);
    if (err) {
        vscode.window.showErrorMessage(err);
        return;
    }
    const taskList = buildTaskArray(extractTask(out));
    await taskService.updateTask(...taskList);

    taskView.taskViewDataProvider.refresh();
}


async function cancelTask(task: TaskItem) {
    const result = await vscode.window.showWarningMessage(
        vscode.l10n.t(`Cancel task named {0}?`, task.task.name),
        vscode.l10n.t('Yes'),
        vscode.l10n.t('No')
    );
    if (result === vscode.l10n.t('Yes')) {
        const [out, err] = await executeCmd(`scancel ${task.task.jobArrayId}`);
        if (err) {
            vscode.window.showErrorMessage(err);
            return;
        }
        taskService.deleteTask(task.task.jobid, task.task.arrayid);
        taskView.taskViewDataProvider.refresh();
    }
}

async function cancelTaskArray(taskArray: TaskArrayItem) {
    const result = await vscode.window.showWarningMessage(
        vscode.l10n.t(`Cancel task array named {0}?`, taskArray.taskArray.name),
        vscode.l10n.t('Yes'),
        vscode.l10n.t('No')
    );
    if (result === vscode.l10n.t('Yes')) {
        const [out, err] = await executeCmd(`scancel ${taskArray.taskArray.jobid}`);
        if (err) {
            vscode.window.showErrorMessage(err);
            return;
        }
        taskService.deleteTask(taskArray.taskArray.jobid);
        taskView.taskViewDataProvider.refresh();
    }
}

async function cancelSelectedTasks() {
    if (taskView.selectedTaskItems.length === 0) { return; }
    const tasks: BaseTask[] = taskView.selectedTaskItems.map(v => v instanceof TaskArrayItem ? v.taskArray : v.task);
    const taskLen = tasks.map(v => v instanceof TaskArray ? v.getSubTasks() : v).flat().length;
    const result = await vscode.window.showWarningMessage(
        vscode.l10n.t(`This will cancel {0} tasks below: `, taskLen) + tasks.map(v => v.name).join('; '),
        vscode.l10n.t('Yes'),
        vscode.l10n.t('No')
    );
    if (result === vscode.l10n.t('Yes')) {
        tasks.forEach(v => {
            executeCmd(`scancel ${v.jobArrayId instanceof Array ? v.jobid : v.jobArrayId}`);
            taskService.deleteTask(v.jobid, v.arrayid);
        });
        taskView.taskViewDataProvider.refresh();
    } else if (result === vscode.l10n.t('No')) {
    }
}

async function cancelAllTasks() {
    const tasks = taskService.getTask().filter(v => !v.finished);
    const taskLen = tasks.map(v => v instanceof TaskArray ? v.getSubTasks() : v).flat().length;
    const result = await vscode.window.showWarningMessage(
        vscode.l10n.t(`This will cancel all {0} tasks below (unscaned tasks will not be canceled): `, taskLen) + tasks.map(v => v.name).join('; '),
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
        taskService.deleteTask(task.task.jobid, task.task.arrayid);
        taskView.taskViewDataProvider.refresh();
    }
}

async function confirmTaskArray(taskArray: TaskArrayItem) {
    if (taskArray.taskArray.finished) {
        taskService.deleteTask(taskArray.taskArray.jobid);
        taskView.taskViewDataProvider.refresh();
    }
}

async function confirmAllTask() {
    taskService.getTask().filter(v => v.finished).forEach(v => taskService.deleteTask(v));
    taskView.taskViewDataProvider.refresh();
}


async function openFile(file: LogFile) {
    file.open();
}

async function openStdout(task: TaskItem) {
    task.task.outPath.open();
}

async function openStderr(task: TaskItem) {
    task.task.errPath.open();
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

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.cancelTaskArray', cancelTaskArray));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.confirmTaskArray', confirmTaskArray));

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.openFile', openFile));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.openStdout', openStdout));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.openStderr', openStderr));

    vscode.commands.executeCommand('setContext', 'autoRefreshingTask', false);

    cachePath = path.join(context.globalStorageUri.fsPath, 'tasks_cache.json');
}


