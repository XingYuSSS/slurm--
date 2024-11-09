import * as vscode from 'vscode';

import { taskService } from '../services';
import { Task } from '../models/';
import { FinishedTaskItem, InfoItem, ListItem, LogFileItem, TaskItem } from './components';

function getTaskInfoItems(task: Task): vscode.TreeItem[] {
    return [
        new InfoItem(task.jobid.toString(), 'id'),
        new InfoItem(task.gres?.toString() ?? 'No GRES', 'GRES'),
        new InfoItem(task.command, 'command'),
        new LogFileItem(task.out_path, 'stdout'),
        new LogFileItem(task.err_path, 'stderr'),
    ];
}

function getGroupedTask(tasks: Task[]): ListItem[] {
    let running = tasks.filter(v => !v.finished);
    let finished = tasks.filter(v => v.finished);
    // console.log(running)
    // console.log(finished)
    return [
        new ListItem('running', running.map((value) => { return new TaskItem(value); }), '${length} tasks'),
        new ListItem('finished', finished.map((value) => { return new FinishedTaskItem(value); }), '${length} tasks', undefined, 'finishedTaskList'),
    ];
}

export class TaskViewDataProvider implements vscode.TreeDataProvider<TaskItem | InfoItem | ListItem | LogFileItem | FinishedTaskItem> {
    private static _instance: TaskViewDataProvider | null = null;
    private constructor() { }

    static getInstance() {
        if (TaskViewDataProvider._instance === null) {
            TaskViewDataProvider._instance = new TaskViewDataProvider();
        }
        return TaskViewDataProvider._instance;
    }

    private _onDidChangeTreeData: vscode.EventEmitter<TaskItem | undefined | null | void> = new vscode.EventEmitter<TaskItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TaskItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TaskItem | InfoItem | ListItem | LogFileItem | FinishedTaskItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TaskItem | FinishedTaskItem | ListItem): Thenable<ListItem[] | TaskItem[] | FinishedTaskItem[] | InfoItem[] | LogFileItem[]> {
        if (!element) {
            return Promise.resolve(getGroupedTask(taskService.getTask()));
        }
        if (element instanceof TaskItem || element instanceof FinishedTaskItem) {
            return Promise.resolve(getTaskInfoItems(element.task));
        } else if (element instanceof ListItem) {
            return Promise.resolve(element.children);
        }
        return Promise.resolve([]);
    }
}

export const taskViewDataProvider = TaskViewDataProvider.getInstance();
export let taskTreeView: vscode.TreeView<InfoItem>;
export let selectedTaskItems: TaskItem[] = [];

export function initTasksView(context: vscode.ExtensionContext) {
    taskTreeView = vscode.window.createTreeView('slurm--_tasks_view', { treeDataProvider: taskViewDataProvider, canSelectMany: true });
    const disposable = taskTreeView.onDidChangeSelection(e => {
        selectedTaskItems = [];
        if (e.selection && e.selection.length > 0) {
            selectedTaskItems = e.selection.filter(v => v instanceof TaskItem);
        }
    });

    context.subscriptions.push(disposable);

}
