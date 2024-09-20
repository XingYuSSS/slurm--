import * as vscode from 'vscode';
import * as fs from 'fs';
import * as childProcess from 'child_process';

import { extensionRootUri } from '../extension';
import { runBash } from '../utils';
import * as taskModel from '../model/tasks_model';
import * as taskView from '../view/tasks_view';

// console.log(extensionRootUri);
// while (extensionRootUri !== null){}
// const command_json = JSON.parse(fs.readFileSync(vscode.Uri.joinPath(extensionRootUri, 'src', 'commands', 'commands.json').fsPath, 'utf-8'));
let autoRefreshTimer: NodeJS.Timeout;
let refreshInterval: number = 3000;


function extractTask(taskString: string, short_length: number, long_length: number): taskModel.Task[] {
    let slices = [short_length, long_length, short_length, short_length, short_length, short_length, short_length, short_length, long_length, long_length, long_length, short_length];
    slices.reduce((arr, currentValue, currentIndex)=>{
        if (currentIndex > 0) {
            slices[currentIndex] = slices[currentIndex - 1] + currentValue;
        }
        return slices[currentIndex - 1] + currentValue;
    }, 0);
    slices.unshift(0);

    let taskList: taskModel.Task[] = [];
    taskString.split('\n').forEach((value) => {
        // JobID,Name:255,Username:20,State:20,NodeList,Gres:50,TimeLimit,TimeUsed,Command:255,STDOUT:255,STDERR:255,Reason:100
        if (value.length === 0) { return; }
        
        // console.log(value)
        let fields: string[] = slices.slice(1).reduce((arr: string[], v, i)=>{
            arr.push(value.substring(v, slices[i]).trim());
            return arr;
        }, []);
        // console.log(fields)
        const task = new taskModel.Task(fields[0], fields[1], fields[2], fields[3], fields[4], fields[5], fields[6], fields[7], fields[8], fields[9], fields[10], fields[11]);
        console.log(task)
        taskList.push(task);
    });
    return taskList;
}

export async function refreshUserTasks() {
    const short = 50;
    const long = 255;
    const [out, err] = await runBash(`squeue --me --noheader -O JobID:${short},Name:${long},Username:${short},State:${short},NodeList:${short},Gres:${short},TimeLimit:${short},TimeUsed:${short},Command:${long},STDOUT:${long},STDERR:${long},Reason:${short}`);
    // vscode.window.showInformationMessage(out);
    taskModel.taskManager.updateTask(...extractTask(out, short, long));
    console.log(taskModel.taskManager)
    taskView.taskViewDataProvider.refresh();
}


export async function cancelTask(task: taskView.TaskViewItem) {
    console.log(task);
    const [out, err] = await runBash(`scancel ${task.task.jobid}`);
    taskModel.taskManager.deleteTask(task.task.jobid);
    // vscode.window.showInformationMessage(out);
    console.log(taskModel.taskManager);
    taskView.taskViewDataProvider.refresh();
}

export async function autoRefreshTask() {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = autoRefreshTimer = setInterval(() => {
        vscode.commands.executeCommand('slurm--.refreshUserTasks');
    }, 3000);
    vscode.commands.executeCommand('setContext', 'autoRefreshing', true);
}

export async function unautoRefreshTask() {
    clearInterval(autoRefreshTimer);
    vscode.commands.executeCommand('setContext', 'autoRefreshing', false);
}

export async function openFile(file: taskView.OpenanleFileItem) {
    file.file.open();
}


export function initTaskCmd(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('slurm--.refreshUserTasks', refreshUserTasks));
	context.subscriptions.push(vscode.commands.registerCommand('slurm--.cancelTask', cancelTask));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.autoRefreshTask', autoRefreshTask));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.unautoRefreshTask', unautoRefreshTask));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.openFile', openFile));

    // vscode.commands.executeCommand('setContext', 'refreshingUserTasks', false);
    vscode.commands.executeCommand('setContext', 'autoRefreshing', false);
    vscode.commands.executeCommand('slurm--.refreshUserTasks');
}


