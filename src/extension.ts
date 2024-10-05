import * as vscode from 'vscode';

import { initTaskCmd } from './commands/tasks_commands';
import { initTasksView} from './view/tasks_view';
import { initConfigView } from './view/config_view';
import { initConfigManager } from './utils/config_manager';
import { initTaskManager } from './model/tasks_model';

export var extensionRootUri: vscode.Uri;
export var userName: string;

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "slurm--" is now active!');

	extensionRootUri = vscode.Uri.file(context.extensionPath);
	
	initConfigManager(context);
	initTaskManager(context);

	initTaskCmd(context);

	initTasksView(context);
	// context.subscriptions.push(vscode.window.createTreeView('slurm--_config_view', { treeDataProvider: taskViewDataProvider }));
	

}

export function deactivate() {}
