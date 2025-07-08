import * as vscode from 'vscode';
import { Task, TaskArray } from '../../models';
import { taskStateIconMap, unknownStateIcon } from './taskIcons';

export class FinishedTaskItem extends vscode.TreeItem {
    constructor(public readonly task: Task) {
        super(task.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.iconPath = taskStateIconMap[task.state] ?? unknownStateIcon;
        this.tooltip = `Status: ${task.state} (${task.exitCode ?? 'N/A'})`;
        this.contextValue = 'finishedTaskItem';
        this.id = task.jobArrayId;
    }
}


const successArrIcon = new vscode.ThemeIcon('pass-filled', new vscode.ThemeColor('gitDecoration.addedResourceForeground'));
const failureArrIcon = new vscode.ThemeIcon('error', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'));
const mixedArrIcon = new vscode.ThemeIcon('warning', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'));

function getFinishedTaskArrayIcon(taskArray: TaskArray): vscode.ThemeIcon {
    const results = taskArray.getSubTasks().map(task => task.isSuccessful());
    if (results.every(res => res === true)) { return successArrIcon; }
    if (results.some(res => res === true)) { return mixedArrIcon; }
    return failureArrIcon;
}

export class FinishedTaskArrayItem extends vscode.TreeItem {
    constructor(public readonly taskArray: TaskArray) {
        super(taskArray.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.iconPath = getFinishedTaskArrayIcon(taskArray);
        this.contextValue = 'finishedTaskArrayItem';
        this.id = 'array_' + taskArray.jobArrayId.join('&');
    }
}
