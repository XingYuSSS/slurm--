import * as vscode from 'vscode';

import { runBash } from '../utils/utils';
import { LogFile, Task } from '../models';
import { taskService, configService } from '../services';
import * as taskView from '../view/taskView';
import { LogFileItem, TaskItem } from '../view/components';

// while (extensionRootUri !== null){}
// const command_json = JSON.parse(fs.readFileSync(vscode.Uri.joinPath(extensionRootUri, 'src', 'commands', 'commands.json').fsPath, 'utf-8'));
let autoRefreshTimer: NodeJS.Timeout;

function extractTask(taskString: string, short_length: number, long_length: number): Task[] {
    let slices = [short_length, long_length, short_length, short_length, short_length, short_length, short_length, short_length, long_length, long_length, long_length, short_length];
    slices.reduce((arr, currentValue, currentIndex) => {
        if (currentIndex > 0) {
            slices[currentIndex] = slices[currentIndex - 1] + currentValue;
        }
        return slices[currentIndex - 1] + currentValue;
    }, 0);
    slices.unshift(0);

    let taskList: Task[] = [];
    taskString.split('\n').forEach((value) => {
        // JobID,Name:255,Username:50,State:50,NodeList,Gres:50,TimeLimit,TimeUsed,Command:255,STDOUT:255,STDERR:255,Reason:100
        if (value.length === 0) { return; }

        let fields: string[] = slices.slice(1).reduce((arr: string[], v, i) => {
            arr.push(value.substring(v, slices[i]).trim());
            return arr;
        }, []);
        const task = new Task(fields[0], fields[1], fields[2], fields[3], fields[4], fields[5], fields[6], fields[7], fields[8], fields[9], fields[10], fields[11]);
        taskList.push(task);
    });
    return taskList;
}

export async function refreshUserTasks() {
    vscode.commands.executeCommand('setContext', 'refreshingUserTasks', true);
    const short = 50;
    const long = 255;
    const [out, err] = await runBash(`squeue --me --noheader -O JobID:${short},Name:${long},Username:${short},State:${short},NodeList:${short},Gres:${short},TimeLimit:${short},TimeUsed:${short},Command:${long},STDOUT:${long},STDERR:${long},Reason:${short}`);
    taskService.updateTask(...extractTask(out, short, long));
    taskView.taskViewDataProvider.refresh();
    vscode.commands.executeCommand('setContext', 'refreshingUserTasks', false);
}


export async function cancelTask(task: TaskItem) {
    const result = await vscode.window.showWarningMessage(
        `Cancel task named ${task.task.name}?`,
        'Yes',
        'No'
    );
    if (result === 'Yes') {
        const [out, err] = await runBash(`scancel ${task.task.jobid}`);
        taskService.deleteTask(task.task.jobid);
        taskView.taskViewDataProvider.refresh();
    } else if (result === 'No') {
    }
}

export async function cancelSelectedTasks() {
    if (taskView.selectedTaskItems.length === 0) { return; }
    const tasks = taskView.selectedTaskItems.map(v => v.task);
    const result = await vscode.window.showWarningMessage(
        `This will cancel ${tasks.length} tasks below: ` + tasks.map(v => v.name).join('; '),
        'Yes',
        'No'
    );
    if (result === 'Yes') {
        tasks.forEach(v => {
            runBash(`scancel ${v.jobid}`);
            taskService.deleteTask(v.jobid);
        });
        taskView.taskViewDataProvider.refresh();
    } else if (result === 'No') {
    }
}

export async function autoRefreshTask() {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(() => {
        vscode.commands.executeCommand('slurm--.refreshUserTasks');
    }, configService.taskRefreshInterval_ms);
    vscode.commands.executeCommand('setContext', 'autoRefreshingTask', true);
}

export async function unautoRefreshTask() {
    clearInterval(autoRefreshTimer);
    vscode.commands.executeCommand('setContext', 'autoRefreshingTask', false);
}

export async function confirmTask(task: TaskItem) {
    if (task.task.finished) {
        taskService.deleteTask(task.task);
        taskView.taskViewDataProvider.refresh();
    }
}

export async function confirmAllTask() {
    taskService.deleteTask(...taskService.getTask().filter(v => v.finished));
    taskView.taskViewDataProvider.refresh();
}


export async function openFile(file: LogFile) {
    file.open();
}


export function initTaskCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.refreshUserTasks', refreshUserTasks));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.cancelTask', cancelTask));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.cancelSelectedTasks', cancelSelectedTasks));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.autoRefreshTask', autoRefreshTask));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.unautoRefreshTask', unautoRefreshTask));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.confirmTask', confirmTask));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.confirmAllTask', confirmAllTask));

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.openFile', openFile));

    vscode.commands.executeCommand('setContext', 'refreshingUserTasks', false);
    vscode.commands.executeCommand('setContext', 'autoRefreshingTask', false);
    vscode.commands.executeCommand('slurm--.refreshUserTasks');
}


