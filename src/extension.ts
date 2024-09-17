import * as vscode from 'vscode';

import { registerCustomCommands } from './commands/register_commands';
import { taskViewDataProvider} from './view/tasks_view';

export var extensionRootUri: vscode.Uri;
export var userName: string;

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "slurm--" is now active!');

	extensionRootUri = vscode.Uri.file(context.extensionPath);

	registerCustomCommands(context);

	context.subscriptions.push(vscode.window.createTreeView('slurm--_tasks_view', { treeDataProvider: taskViewDataProvider }));
	context.subscriptions.push(vscode.window.createTreeView('slurm--_config_view', { treeDataProvider: taskViewDataProvider }));


}

export function deactivate() {}
