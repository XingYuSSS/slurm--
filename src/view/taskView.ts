import * as vscode from 'vscode';

import { taskService, configService, TaskSortKeys } from '../services';
import { Task } from '../models/';
import { FinishedTaskItem, InfoItem, ListItem, LogFileItem, TaskItem } from './components';
import { resignFn } from '../utils/utils';

function getTaskInfoItems(task: Task): vscode.TreeItem[] {
    return [
        new InfoItem(task.jobid.toString(), 'id'),
        ...(task.node.length === 0 ? [new InfoItem(task.node, 'nodelist')] : []),
        new InfoItem(task.gres?.toString() ?? 'No GRES', 'GRES'),
        new LogFileItem(task.command, 'command', undefined, configService.taskShowFilenameOnly),
        new LogFileItem(task.out_path, 'stdout', undefined, configService.taskShowFilenameOnly),
        new LogFileItem(task.err_path, 'stderr', undefined, configService.taskShowFilenameOnly),
        new InfoItem(task.submit_time?.replace('T', ' '), 'submited'),
        ...(task.start_time ? [
            new InfoItem(task.start_time.replace('T', ' '), 'started'),
            new InfoItem(task.end_time!.replace('T', ' '), task.finished ? 'finished' : 'finish (exp)'),
        ] : [])
    ];
}

const sortFn = new Map([
    [TaskSortKeys.ID, (a: Task, b: Task) => a.jobid - b.jobid],
    [TaskSortKeys.NAME, (a: Task, b: Task) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })]
]);

function getGroupedTask(tasks: Task[]): ListItem[] {
    let running = tasks.filter(v => !v.finished).sort(resignFn(sortFn.get(configService.taskSortKey)!, configService.taskSortAscending));
    let finished = tasks.filter(v => v.finished).sort(resignFn(sortFn.get(configService.taskSortKey)!, configService.taskSortAscending));
    return [
        new ListItem(vscode.l10n.t('running'), running.map((value) => { return new TaskItem(value); }), vscode.l10n.t('${length} tasks'), undefined, 'taskList'),
        new ListItem(vscode.l10n.t('finished'), finished.map((value) => { return new FinishedTaskItem(value); }), vscode.l10n.t('${length} tasks'), undefined, 'finishedTaskList'),
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
