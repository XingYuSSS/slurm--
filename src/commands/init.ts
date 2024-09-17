import * as vscode from 'vscode';

import * as tasks from './tasks_commands';

// function register_command(name: string, callback: (...args: any[]) => any) {
//     const command = vscode.commands.registerCommand(name, callback);

// 	context.subscriptions.push(disposable);
// }

export function initCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('slurm--.refreshUserTasks', tasks.refreshUserTasks));
	context.subscriptions.push(vscode.commands.registerCommand('slurm--.cancelTask', tasks.cancelTask));
	// context.subscriptions.push(vscode.commands.registerCommand('slurm--.showAllTasks', tasks.getUserTasks));
	
	setInterval(() => {
		vscode.commands.executeCommand('slurm--.refreshUserTasks');
	}, 2000);
}
