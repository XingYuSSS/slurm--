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
import { initQueryStatus } from './services/queryStatus';
import { taskTreeView } from './view/taskView';
import { resourceTreeView } from './view/resourceView';

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
	initQueryStatus(context, taskTreeView, resourceTreeView);

	vscode.commands.executeCommand('slurm--.refreshUserTasks', true);
	vscode.commands.executeCommand('slurm--.refreshResources', true);
	vscode.commands.executeCommand('slurm--.refreshLauncher');

	initCompletion(context);
}

export function deactivate() { }
