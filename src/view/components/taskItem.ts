import * as vscode from 'vscode';
import { Task, TaskArray, TaskState } from '../../models';

function taskDescription(task: Task): string {
    return task.state === TaskState.R ? task.runningTime + '/' + task.limitTime : task.reason;
}

function taskTooltip(task: Task): vscode.MarkdownString {
    return new vscode.MarkdownString(`
| id | user | status | nodelist | gres |
|:--:|:--:|:--:|:--:|:--:|
| ${task.jobArrayId} | ${task.user} | ${task.state} | ${task.node} | ${task.gres ?? 'No GRES'} |
    `);
}

const iconRec: Record<TaskState, vscode.ThemeIcon> = {
    [TaskState.R]: new vscode.ThemeIcon('debug-start', new vscode.ThemeColor('gitDecoration.addedResourceForeground')),
    [TaskState.PD]: new vscode.ThemeIcon('watch', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground')),
    [TaskState.CG]: new vscode.ThemeIcon('pass', new vscode.ThemeColor('gitDecoration.addedResourceForeground')),
    // [TaskState.PD, new vscode.ThemeIcon('warning', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'))], //感叹号
    // [TaskState.PD, new vscode.ThemeIcon('error', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'))], //叉
};

export class TaskItem extends vscode.TreeItem {
    constructor(public readonly task: Task) {
        super(task.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.description = taskDescription(task);
        this.tooltip = taskTooltip(task);
        this.iconPath = iconRec[task.state];
        this.contextValue = 'taskItem';
    }
}


const iconArrMap: Record<TaskState, vscode.ThemeIcon> = {
    [TaskState.R]: new vscode.ThemeIcon('run-all', new vscode.ThemeColor('gitDecoration.addedResourceForeground')),
    [TaskState.PD]: new vscode.ThemeIcon('watch', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground')),
    [TaskState.CG]: new vscode.ThemeIcon('pass-filled', new vscode.ThemeColor('gitDecoration.addedResourceForeground')),
    // [TaskState.PD, new vscode.ThemeIcon('warning', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'))], //感叹号
    // [TaskState.PD, new vscode.ThemeIcon('error', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'))], //叉
};

function taskArrDescription(taskArray: TaskArray): string {
    const counts = taskArray.getSubTasks().reduce((acc, item) => {
        acc[item.state] = (acc[item.state] || 0) + 1;
        return acc;
    }, {} as Record<TaskState, number>);
    return vscode.l10n.t(`Pend {0}, Run {1}, Done {2}`, counts[TaskState.PD] ?? 0, counts[TaskState.R] ?? 0, counts[TaskState.CG] ?? 0);
}

function taskArrTooltip(taskArray: TaskArray): vscode.MarkdownString {
    return new vscode.MarkdownString(`
| arrayId | user | status | nodelist | gres |
|:--:|:--:|:--:|:--:|:--:|
${taskArray.getSubTasks().slice(0, 10).map(task => `| ${task.arrayid} | ${task.user} | ${task.state} | ${task.node} | ${task.gres ?? 'No GRES'} |`).join('\n')}
${taskArray.getSubTasks().length > 10 ? '|...|...|...|...|...|' : ''}
    `);
}

export class TaskArrayItem extends vscode.TreeItem {
    constructor(public readonly taskArray: TaskArray) {
        super(taskArray.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.description = taskArrDescription(taskArray);
        this.tooltip = taskArrTooltip(taskArray);
        this.iconPath = iconArrMap[taskArray.state];
        this.contextValue = 'taskArrayItem';
    }
}
