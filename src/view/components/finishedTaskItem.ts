import * as vscode from 'vscode';
import { Task } from '../../models';

const finishedIcon = new vscode.ThemeIcon('pass', new vscode.ThemeColor('gitDecoration.addedResourceForeground'));

export class FinishedTaskItem extends vscode.TreeItem {
    constructor(public readonly task: Task) {
        super(task.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.iconPath = finishedIcon;
        this.contextValue = 'finishedTaskItem';
    }
}