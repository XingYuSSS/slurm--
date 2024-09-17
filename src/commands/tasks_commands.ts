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

function extractTask(taskString: string): taskModel.Task[]{
    const regex = /\S+/g;
    let taskList: taskModel.Task[] = [];
    taskString.split('\n').slice(1).forEach((value)=>{
        let fields: string[] = value.match(regex)?.map(value => value.trim()).filter(value => value.length>0)!;
        taskList.push(new taskModel.Task(fields[0], fields[2], fields[3], fields[4], fields[5], fields[7]));
    });
    return taskList;
}

export async function refreshUserTasks() {
    const [out, err] = await runBash('squeue --me');
    // vscode.window.showInformationMessage(out);
    taskModel.taskManager.updateTask(...extractTask(out));
    // console.log(taskModel.taskManager);
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

// export function getAllTasks() {
//     const command = new vscode.ShellExecution('squeue');
// }


