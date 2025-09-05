import * as vscode from 'vscode';

import { configService, GresGroupKeys, GresSortKeys, SortDirection, TaskInfoConfig, TaskInfoConfigKeys, TaskSortKeys } from '../services';
import { taskViewDataProvider } from '../view/taskView';
import { resourceViewDataProvider } from '../view/resourceView';

function getOpenConfig(context: vscode.ExtensionContext) {
    return () => {
        vscode.commands.executeCommand('workbench.action.openSettings', `@ext:${context.extension.id}`);
    };
}

function setTaskFilenameOnly(only: boolean) {
    configService.taskShowFilenameOnly = only;
    taskViewDataProvider.refresh();
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

function setResourcGroupKey(key: GresGroupKeys) {
    configService.gresGroupKey = key;
    resourceViewDataProvider.refresh();
}

function setTaskShowShortcutKey(show: boolean) {
    configService.taskShowShortcutKey = show;
}

async function setTaskDisplayInfo() {
    const showing = configService.taskDisplayInfo;
    const selected = await vscode.window.showQuickPick(
        TaskInfoConfigKeys.map(v => { return { label: v, picked: showing[v] }; }),
        { canPickMany: true, title: vscode.l10n.t('Configure display information for expanded task in tasksPanel') }
    );

    if (selected === undefined) { return; }
    const selectedKeys = selected.map(item => item.label);
    const config = TaskInfoConfigKeys.reduce((acc, item) => {
        acc[item] = selectedKeys.includes(item);
        return acc;
    }, {} as TaskInfoConfig);
    configService.taskDisplayInfo = config;
    taskViewDataProvider.refresh();
}

export function initConfigCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.openConfig', getOpenConfig(context)));

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.setTaskFilenameOnly', () => setTaskFilenameOnly(true)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.unsetTaskFilenameOnly', () => setTaskFilenameOnly(false)));

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

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.setResourceGroupByGres', () => setResourcGroupKey(GresGroupKeys.GRES)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.setResourceGroupByPartition', () => setResourcGroupKey(GresGroupKeys.PARTITION)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.settedResourceGroupByGres', () => setResourcGroupKey(GresGroupKeys.GRES)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.settedResourceGroupByPartition', () => setResourcGroupKey(GresGroupKeys.PARTITION)));

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.showTaskShortcutKey', () => setTaskShowShortcutKey(true)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.hideTaskShortcutKey', () => setTaskShowShortcutKey(false)));

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.setTaskDisplayInfo', setTaskDisplayInfo));
}

