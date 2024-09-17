import * as vscode from 'vscode';

import * as taskModel from '../model/tasks_model';

class TaskViewItem extends vscode.TreeItem {
    constructor(public readonly task: taskModel.Task, public readonly collapsibleState: vscode.TreeItemCollapsibleState) {
        super(task.name, collapsibleState);
        this.description = task.runing_time;
        this.tooltip = task.markdownDescription();
    }
}



export class TaskViewDataProvider implements vscode.TreeDataProvider<TaskViewItem> {
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

    getTreeItem(element: TaskViewItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TaskViewItem): Thenable<TaskViewItem[]> {
        if (!element) {
            return Promise.resolve(taskModel.taskManager.getTask().map((value) => { return new TaskViewItem(value, vscode.TreeItemCollapsibleState.None); }));
        }
        return Promise.resolve([]);
    }
}

export const taskViewDataProvider = TaskViewDataProvider.getInstance();
