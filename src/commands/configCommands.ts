import * as vscode from 'vscode';

import { configService, GresSortKeys, SortDirection, TaskSortKeys } from '../services';
import { taskViewDataProvider } from '../view/taskView';
import { resourceViewDataProvider } from '../view/resourceView';

function getOpenConfig(context: vscode.ExtensionContext) {
    return () => {
        vscode.commands.executeCommand('workbench.action.openSettings', `@ext:${context.extension.id}`);
    };
}

function setTaskSortKey(key: TaskSortKeys) {
    configService.taskSortKey = key;
    taskViewDataProvider.refresh();
}

function setResourceSortKey(key: GresSortKeys) {
    configService.gresSortKey = key;
    resourceViewDataProvider.refresh();
}

function setTaskSortDirection(direction: SortDirection) {
    configService.taskSortDirection = direction;
    taskViewDataProvider.refresh();
}

function setResourceSortDirection(direction: SortDirection) {
    configService.gresSortDirection = direction;
    resourceViewDataProvider.refresh();
}

function setTaskShowShortcutKey(show: boolean) {
    configService.taskShowShortcutKey = show;
}

export function initConfigCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.openConfig', getOpenConfig(context)));

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.setTaskSortById', () => setTaskSortKey(TaskSortKeys.ID)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.setTaskSortByName', () => setTaskSortKey(TaskSortKeys.NAME)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.settedTaskSortById', () => setTaskSortKey(TaskSortKeys.ID)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.settedTaskSortByName', () => setTaskSortKey(TaskSortKeys.NAME)));

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.setResourceSortByName', () => setResourceSortKey(GresSortKeys.NAME)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.setResourceSortByAvail', () => setResourceSortKey(GresSortKeys.AVAIL)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.settedResourceSortByName', () => setResourceSortKey(GresSortKeys.NAME)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.settedResourceSortByAvail', () => setResourceSortKey(GresSortKeys.AVAIL)));

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.setTaskSortAscend', () => setTaskSortDirection(SortDirection.ASCEND)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.setTaskSortDescend', () => setTaskSortDirection(SortDirection.DESCEND)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.settedTaskSortAscend', () => setTaskSortDirection(SortDirection.ASCEND)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.settedTaskSortDescend', () => setTaskSortDirection(SortDirection.DESCEND)));

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.setResourceSortAscend', () => setResourceSortDirection(SortDirection.ASCEND)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.setResourceSortDescend', () => setResourceSortDirection(SortDirection.DESCEND)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.settedResourceSortAscend', () => setResourceSortDirection(SortDirection.ASCEND)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.settedResourceSortDescend', () => setResourceSortDirection(SortDirection.DESCEND)));

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.showTaskShortcutKey', () => setTaskShowShortcutKey(true)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.hideTaskShortcutKey', () => setTaskShowShortcutKey(false)));
}

