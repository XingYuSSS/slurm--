import * as vscode from 'vscode';
import { Task, TaskArray, TaskState } from '../models';
import { configService, FinishedTaskFilter, taskService } from '../services';
import { taskTreeView, taskViewDataProvider } from '../view/taskView';

function currentTasks(): Task[] {
    return taskService.getTask().flatMap(task => task instanceof TaskArray ? task.getSubTasks() : [task as Task]);
}

export async function findTask() {
    const tasks = currentTasks();
    if (tasks.length === 0) {
        vscode.window.showInformationMessage(vscode.l10n.t('No retained tasks to search.'));
        return;
    }
    const selected = await vscode.window.showQuickPick(tasks.map(task => ({
        label: task.jobArrayId,
        description: task.name,
        detail: task.state === TaskState.AWAITING_ACCOUNTING ? vscode.l10n.t('Awaiting completion information') : task.state,
        jobArrayId: task.jobArrayId,
    })), {
        title: vscode.l10n.t('Find task'),
        placeHolder: vscode.l10n.t('Job ID or task name'),
        matchOnDescription: true,
    });
    if (!selected) { return; }

    let item = taskViewDataProvider.findTask(selected.jobArrayId);
    if (!item && currentTasks().some(task => task.jobArrayId === selected.jobArrayId)
        && configService.finishedTaskFilter !== FinishedTaskFilter.ALL) {
        const showAll = vscode.l10n.t('Show all finished tasks');
        const choice = await vscode.window.showInformationMessage(
            vscode.l10n.t('This task is hidden by the finished task filter.'), showAll);
        if (choice !== showAll) { return; }
        configService.finishedTaskFilter = FinishedTaskFilter.ALL;
        taskViewDataProvider.refresh();
        item = taskViewDataProvider.findTask(selected.jobArrayId);
    }
    if (!item) {
        vscode.window.showInformationMessage(vscode.l10n.t('This task is no longer retained.'));
        return;
    }
    await taskTreeView.reveal(item, { select: true, focus: true, expand: true });
}
