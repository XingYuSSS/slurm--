import * as vscode from 'vscode';

import { initTaskCmd } from './commands/taskCommands';
import { initResCmd } from './commands/resourceCommand';
import { initTasksView } from './view/taskView';
import { initConfigManager, initTaskManager } from './services';

export var extensionRootUri: vscode.Uri;
export var userName: string;

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "slurm--" is now active!');

	extensionRootUri = vscode.Uri.file(context.extensionPath);
	
	initConfigManager(context);
	initTaskManager(context);

	initTaskCmd(context);
	initResCmd(context);

	initTasksView(context);
	// context.subscriptions.push(vscode.window.createTreeView('slurm--_config_view', { treeDataProvider: taskViewDataProvider }));
	

}

export function deactivate() {}
