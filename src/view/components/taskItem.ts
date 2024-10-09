import * as vscode from 'vscode';
import { Task, TaskState } from '../../models';

function taskDescription(task: Task): string {
    return task.state === TaskState.R ? task.runing_time + '/' + task.limit_time : task.reason;
}

function taskTooltip(task: Task): vscode.MarkdownString {
    return new vscode.MarkdownString(`
| id | user | status | gres |
|:--:|:--:|:--:|:--:|
| ${task.jobid} | ${task.user} | ${task.state} | ${task.gres} |
    `);
}

const iconMap: Map<TaskState, vscode.ThemeIcon> = new Map([
    [TaskState.R, new vscode.ThemeIcon('debug-start', new vscode.ThemeColor('gitDecoration.addedResourceForeground'))],
    [TaskState.PD, new vscode.ThemeIcon('watch', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'))],
    [TaskState.CG, new vscode.ThemeIcon('pass', new vscode.ThemeColor('gitDecoration.addedResourceForeground'))],
    // [TaskState.PD, new vscode.ThemeIcon('warning', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'))], //感叹号
    // [TaskState.PD, new vscode.ThemeIcon('error', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'))], //叉
]);

export class TaskItem extends vscode.TreeItem {
    constructor(public readonly task: Task) {
        super(task.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.description = taskDescription(task);
        this.tooltip = taskTooltip(task);
        this.iconPath = iconMap.get(task.state);
        this.contextValue = 'taskItem';
    }
}