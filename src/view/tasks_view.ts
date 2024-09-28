import * as vscode from 'vscode';

import * as taskModel from '../model/tasks_model';

function taskDescription(task: taskModel.Task): string {
    return task.state === taskModel.TaskState.R ? task.runing_time + '/' + task.limit_time : task.reason;
}

function taskTooltip(task: taskModel.Task): vscode.MarkdownString {
    return new vscode.MarkdownString(`
| id | user | status | gres |
|:--:|:--:|:--:|:--:|
| ${task.jobid} | ${task.user} | ${task.state} | ${task.gres} |
    `);
}

const iconMap: Map<taskModel.TaskState, vscode.ThemeIcon> = new Map([
    [taskModel.TaskState.R, new vscode.ThemeIcon('debug-start', new vscode.ThemeColor('gitDecoration.addedResourceForeground'))],
    [taskModel.TaskState.PD, new vscode.ThemeIcon('watch', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'))],
    // [taskModel.TaskState.PD, new vscode.ThemeIcon('warning', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'))], //感叹号
    // [taskModel.TaskState.PD, new vscode.ThemeIcon('error', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'))], //叉
    // [taskModel.TaskState.PD, new vscode.ThemeIcon('pass', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'))], //勾
]);

const finishedIcon = new vscode.ThemeIcon('pass', new vscode.ThemeColor('gitDecoration.addedResourceForeground'));

export class TaskViewItem extends vscode.TreeItem {
    constructor(public readonly task: taskModel.Task) {
        super(task.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.description = taskDescription(task);
        this.tooltip = taskTooltip(task);
        this.iconPath = iconMap.get(task.state);
        this.contextValue = 'taskItem';
    }
}

export class FinishedTaskViewItem extends vscode.TreeItem {
    constructor(public readonly task: taskModel.Task) {
        super(task.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.iconPath = finishedIcon;
        this.contextValue = 'finishedTaskItem';
    }
}

export class listItem extends vscode.TreeItem {
    constructor(public readonly title: string, public readonly children: vscode.TreeItem[], contextValue?: string) {
        super(title, vscode.TreeItemCollapsibleState.Collapsed);
        this.description = `${children.length} tasks`;
        this.contextValue = contextValue;
    }
}

export class InfoItem extends vscode.TreeItem {
    constructor(label: string | vscode.TreeItemLabel, description?: string | boolean, tooltip?: string | vscode.MarkdownString) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = description;
        this.tooltip = tooltip;
    }
}

export class OpenanleFileItem extends vscode.TreeItem {
    constructor(public readonly file: taskModel.FilePath, description?: string | boolean, tooltip?: string | vscode.MarkdownString) {
        super(file.name, vscode.TreeItemCollapsibleState.None);
        this.description = description;
        this.tooltip = tooltip;
        this.contextValue = 'openableFile';
    }
}

function getTaskInfoItems(task: taskModel.Task): vscode.TreeItem[] {
    return [
        new InfoItem(task.jobid.toString(), 'id'),
        new InfoItem(task.gres.toString(), 'GRES'),
        new InfoItem(task.command, 'command'),
        new OpenanleFileItem(task.out_path, 'stdout'),
        new OpenanleFileItem(task.err_path, 'stderr'),
    ];
}

function getListItemsOfGroupedTask(tasks: taskModel.Task[]): listItem[] {
    let running = tasks.filter(v => !v.finished);
    let finished = tasks.filter(v => v.finished);
    console.log(running)
    console.log(finished)
    return [
        new listItem('running', running.map((value) => { return new TaskViewItem(value); })),
        new listItem('finished', finished.map((value) => { return new TaskViewItem(value); })),
    ];
}

export class TaskViewDataProvider implements vscode.TreeDataProvider<TaskViewItem | InfoItem> {
    private static _instance: TaskViewDataProvider | null = null;
    private constructor() { }

    static getInstance() {
        if (TaskViewDataProvider._instance === null) {
            TaskViewDataProvider._instance = new TaskViewDataProvider();
        }
        return TaskViewDataProvider._instance;
    }

    private _onDidChangeTreeData: vscode.EventEmitter<TaskViewItem | undefined | null | void> = new vscode.EventEmitter<TaskViewItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TaskViewItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TaskViewItem | InfoItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TaskViewItem | InfoItem): Thenable<TaskViewItem[] | InfoItem[]> {
        if (!element) {
            return Promise.resolve(getListItemsOfGroupedTask(taskModel.taskManager.getTask()));
        }
        if (element instanceof TaskViewItem) {
            return Promise.resolve(getTaskInfoItems(element.task));
        } else if (element instanceof listItem) {
            return Promise.resolve(element.children);
        }
        return Promise.resolve([]);
    }
}

export const taskViewDataProvider = TaskViewDataProvider.getInstance();
