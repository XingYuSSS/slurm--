import * as vscode from 'vscode';

import { taskService, configService, FinishedTaskFilter, TaskSortKeys } from '../services';
import { BaseTask, Task, TaskArray, TaskState } from '../models';
import { FinishedTaskArrayItem, FinishedTaskItem, InfoItem, ListItem, LogFileItem, TaskArrayItem, TaskItem } from './components';
import { resignFn } from '../utils/utils';

function getTaskInfoItems(task: Task): vscode.TreeItem[] {
    return [
        ...(configService.taskDisplayInfo.id ? [new InfoItem(task.jobArrayId, 'id'),] : []),
        ...(configService.taskDisplayInfo.nodelist && task.node.length !== 0 ? [new InfoItem(task.node, 'nodelist'),] : []),
        ...(configService.taskDisplayInfo.GRES ? [new InfoItem(task.gres?.toString() ?? 'No GRES', 'GRES'),] : []),
        ...(configService.taskDisplayInfo.command ? [new LogFileItem(task.command, 'command', undefined, configService.taskShowFilenameOnly),] : []),
        ...(configService.taskDisplayInfo.stdout ? [new LogFileItem(task.outPath, 'stdout', undefined, configService.taskShowFilenameOnly),] : []),
        ...(configService.taskDisplayInfo.stderr ? [new LogFileItem(task.errPath, 'stderr', undefined, configService.taskShowFilenameOnly),] : []),
        ...(configService.taskDisplayInfo.submit ? [new InfoItem(task.submitTime?.replace('T', ' '), 'submited'),] : []),
        ...(task.startTime ? [
            ...(configService.taskDisplayInfo.start ? [new InfoItem(task.startTime.replace('T', ' '), 'started'),] : []),
            ...(configService.taskDisplayInfo.finish ? [new InfoItem(task.endTime!.replace('T', ' '), task.finished ? 'finished' : 'finish (exp)'),] : []),
        ] : [])
    ];
}

const sortFn: Record<TaskSortKeys, (a: BaseTask, b: BaseTask) => number> = {
    [TaskSortKeys.ID]: (a: BaseTask, b: BaseTask) => a.jobid - b.jobid,
    [TaskSortKeys.NAME]: (a: BaseTask, b: BaseTask) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
};

function matchesFinishedTaskFilter(task: Task): boolean {
    switch (configService.finishedTaskFilter) {
        case FinishedTaskFilter.SUCCESSFUL:
            return task.isSuccessful() === true;
        case FinishedTaskFilter.FAILED:
            return task.isSuccessful() === false;
        case FinishedTaskFilter.ALL:
            return true;
    }
}

function getFilteredFinishedSubTasks(taskArray: TaskArray): Task[] {
    return taskArray.getSubTasks().filter(matchesFinishedTaskFilter);
}

function matchesFinishedTaskArrayFilter(taskArray: TaskArray): boolean {
    return getFilteredFinishedSubTasks(taskArray).length > 0;
}

function matchesFinishedTaskListFilter(task: BaseTask): boolean {
    if (configService.finishedTaskFilter === FinishedTaskFilter.ALL) {
        return true;
    }
    if (task instanceof TaskArray) {
        return matchesFinishedTaskArrayFilter(task);
    }
    return matchesFinishedTaskFilter(task as Task);
}

function getFinishedTaskDescription(visibleCount: number, totalCount: number): string {
    switch (configService.finishedTaskFilter) {
        case FinishedTaskFilter.SUCCESSFUL:
            return vscode.l10n.t('{filtered} successful / {total} tasks', {filtered: visibleCount, total: totalCount});
        case FinishedTaskFilter.FAILED:
            return vscode.l10n.t('{filtered} failed / {total} tasks', {filtered: visibleCount, total: totalCount});
        case FinishedTaskFilter.ALL:
            return vscode.l10n.t('{length} tasks', {length: totalCount});
    }
}

function getFinishedTaskTotalCount(task: BaseTask): number {
    return task instanceof TaskArray ? task.getSubTasks().length : 1;
}

function getVisibleFinishedTaskCount(task: BaseTask): number {
    if (configService.finishedTaskFilter === FinishedTaskFilter.ALL) {
        return getFinishedTaskTotalCount(task);
    }
    if (task instanceof TaskArray) {
        return getFilteredFinishedSubTasks(task).length;
    }
    return matchesFinishedTaskFilter(task as Task) ? 1 : 0;
}

function getGroupedTask(tasks: BaseTask[]): ListItem[] {
    const running = tasks.filter(v => !v.finished).sort(resignFn(sortFn[configService.taskSortKey], configService.taskSortAscending));
    const finished = tasks.filter(v => v.finished).sort(resignFn(sortFn[configService.taskSortKey], configService.taskSortAscending));
    const filteredFinished = finished.filter(matchesFinishedTaskListFilter);
    const totalFinishedTaskCount = finished.reduce((sum, value) => sum + getFinishedTaskTotalCount(value), 0);
    const visibleFinishedTaskCount = filteredFinished.reduce((sum, value) => sum + getVisibleFinishedTaskCount(value), 0);

    const runningItem = running.map((value) => { return value instanceof TaskArray ? new TaskArrayItem(value) : new TaskItem(value as Task); });
    const finishedItem = filteredFinished.map((value) => { return value instanceof TaskArray ? new FinishedTaskArrayItem(value) : new FinishedTaskItem(value as Task); });

    return [
        new ListItem(
            vscode.l10n.t('running'),
            runningItem,
            vscode.l10n.t('{length} tasks', {length: runningItem.length}),
            undefined,
            'taskList'
        ),
        new ListItem(
            vscode.l10n.t('finished'),
            finishedItem,
            getFinishedTaskDescription(visibleFinishedTaskCount, totalFinishedTaskCount),
            undefined,
            'finishedTaskList'
        ),
    ];
}

type AllItem = TaskItem | TaskArrayItem | InfoItem | ListItem | LogFileItem | FinishedTaskItem | FinishedTaskArrayItem

export class TaskViewDataProvider implements vscode.TreeDataProvider<AllItem> {
    private static _instance: TaskViewDataProvider | null = null;
    private constructor() { }

    static getInstance() {
        if (TaskViewDataProvider._instance === null) {
            TaskViewDataProvider._instance = new TaskViewDataProvider();
        }
        return TaskViewDataProvider._instance;
    }

    private _onDidChangeTreeData: vscode.EventEmitter<AllItem | undefined | null | void> = new vscode.EventEmitter<AllItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<AllItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
        updateTaskBar();
    }

    getTreeItem(element: AllItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: AllItem): Thenable<AllItem[]> {
        if (!element) {
            return Promise.resolve(getGroupedTask(taskService.getTask()));
        }
        if (element instanceof TaskItem || element instanceof FinishedTaskItem) {
            return Promise.resolve(getTaskInfoItems(element.task));

        } else if (element instanceof TaskArrayItem) {
            return Promise.resolve(element.taskArray.getSubTasks().map(v => new TaskItem(v)));
        } else if (element instanceof FinishedTaskArrayItem) {
            return Promise.resolve(getFilteredFinishedSubTasks(element.taskArray).map(v => new FinishedTaskItem(v)));

        } else if (element instanceof ListItem) {
            return Promise.resolve(element.children);
        }

        return Promise.resolve([]);
    }
}

export const taskViewDataProvider = TaskViewDataProvider.getInstance();
export let taskTreeView: vscode.TreeView<InfoItem>;
export let selectedTaskItems: (TaskItem | TaskArrayItem)[] = [];

export function initTasksView(context: vscode.ExtensionContext) {
    taskTreeView = vscode.window.createTreeView('slurm--_tasks_view', { treeDataProvider: taskViewDataProvider, canSelectMany: true });
    const disposable = taskTreeView.onDidChangeSelection(e => {
        selectedTaskItems = [];
        if (e.selection && e.selection.length > 0) {
            selectedTaskItems = e.selection.filter(v => v instanceof TaskItem || v instanceof TaskArrayItem);
        }
    });
    context.subscriptions.push(disposable);

    initTasksBar(context);
}


export let taskBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);

export function initTasksBar(context: vscode.ExtensionContext) {
    taskBarItem.command = 'slurm--_tasks_view.focus';
    taskBarItem.show();
    context.subscriptions.push(taskBarItem);
}

export function updateTaskBar(): void {
    const tasks = taskService.getTask();
    const pending = tasks.filter(t => t.state === TaskState.PD).length;
    const running = tasks.filter(t => t.state === TaskState.R).length;
    const done = tasks.length - pending - running;

    taskBarItem.text = `$(watch) ${pending} $(run-all) ${running} $(pass) ${done}`;
    taskBarItem.tooltip = vscode.l10n.t('Pend {0}, Run {1}, Done {2}', pending, running, done);
}
