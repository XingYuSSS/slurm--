import * as vscode from 'vscode';

import * as tasks from './tasks_commands';

// function register_command(name: string, callback: (...args: any[]) => any) {
//     const command = vscode.commands.registerCommand(name, callback);

// 	context.subscriptions.push(disposable);
// }

export function registerCustomCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('slurm--.showUserTasks', tasks.getUserTasks));
	// context.subscriptions.push(vscode.commands.registerCommand('slurm--.showAllTasks', tasks.getUserTasks));
}
