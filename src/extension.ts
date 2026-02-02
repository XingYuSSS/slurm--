import * as vscode from 'vscode';

import { initTaskCmd } from './commands/taskCommands';
import { initResourceCmd } from './commands/resourceCommand';
import { initTasksView } from './view/taskView';
import { initConfigService, initTaskService, initScriptService, initContextService } from './services';
import { initResourceView } from './view/resourceView';
import { initLauncherView } from './view/launcherView';
import { initLauncherCmd } from './commands/launcherCommand';
import { initConfigCmd } from './commands/configCommands';
import { initCompletion } from './editors/completion';

export function activate(context: vscode.ExtensionContext) {

	initConfigService(context);
	initTaskService(context);
	initScriptService(context);
	initContextService(context);

	initConfigCmd(context);
	initTaskCmd(context);
	initResourceCmd(context);
	initLauncherCmd(context);

	initTasksView(context);
	initResourceView(context);
	initLauncherView(context);

	vscode.commands.executeCommand('slurm--.refreshUserTasks');
	vscode.commands.executeCommand('slurm--.refreshResources');
	vscode.commands.executeCommand('slurm--.refreshLauncher');

	initCompletion(context);
}

export function deactivate() { }
