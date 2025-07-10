import * as vscode from 'vscode';
import { Task, TaskArray, TaskState } from '../../models';
import { taskStateIconMap, unknownStateIcon } from './taskIcons';

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

export class TaskItem extends vscode.TreeItem {
    constructor(public readonly task: Task) {
        super(task.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.description = taskDescription(task);
        this.tooltip = taskTooltip(task);
        this.iconPath = taskStateIconMap[task.state] ?? unknownStateIcon;
        this.contextValue = 'taskItem';
        this.id = task.jobArrayId;
    }
}


const iconArrMap: Partial<Record<TaskState, vscode.ThemeIcon>> = {
    [TaskState.R]: new vscode.ThemeIcon('run-all', new vscode.ThemeColor('gitDecoration.addedResourceForeground')),
    [TaskState.PD]: new vscode.ThemeIcon('watch', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground')),
    [TaskState.CG]: new vscode.ThemeIcon('pass-filled', new vscode.ThemeColor('gitDecoration.addedResourceForeground')),
};

function taskArrDescription(taskArray: TaskArray): string {
    const counts = taskArray.getSubTasks().reduce((acc, item) => {
        if (item.state === TaskState.PD) {
            acc.pd++;
        } else if (item.state === TaskState.R) {
            acc.r++;
        } else {
            acc.done++;
        }
        return acc;
    }, { pd: 0, r: 0, done: 0 });
    return vscode.l10n.t(`Pend {0}, Run {1}, Done {2}`, counts.pd, counts.r, counts.done);
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
        this.id = 'array_' + taskArray.jobArrayId.join('&');
    }
}
