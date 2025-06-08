import * as vscode from 'vscode';
import { Task, TaskArray } from '../../models';

const finishedIcon = new vscode.ThemeIcon('pass', new vscode.ThemeColor('gitDecoration.addedResourceForeground'));

export class FinishedTaskItem extends vscode.TreeItem {
    constructor(public readonly task: Task) {
        super(task.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.iconPath = finishedIcon;
        this.contextValue = 'finishedTaskItem';
        this.id = task.jobArrayId;
    }
}


const finishedArrIcon = new vscode.ThemeIcon('pass-filled', new vscode.ThemeColor('gitDecoration.addedResourceForeground'));

export class FinishedTaskArrayItem extends vscode.TreeItem {
    constructor(public readonly taskArray: TaskArray) {
        super(taskArray.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.iconPath = finishedArrIcon;
        this.contextValue = 'finishedTaskArrayItem';
        this.id = 'array_' + taskArray.jobArrayId.join('&');
    }
}
