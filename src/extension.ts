import * as vscode from 'vscode';

import { initTaskCmd } from './commands/taskCommands';
import { initResourceCmd } from './commands/resourceCommand';
import { initTasksView } from './view/taskView';
import { initConfigService, initTaskService, initScriptService } from './services';
import { initResourceView } from './view/resourceView';
import { initLauncherView } from './view/launcherView';
import { initLauncherCmd } from './commands/launcherCommand';
import { initConfigCmd } from './commands/configCommands';

export var userName: string;

export function activate(context: vscode.ExtensionContext) {
	// console.log('running')

	initConfigService(context);
	initTaskService(context);
	initScriptService(context);
	initConfigCmd(context);

	initTaskCmd(context);
	initResourceCmd(context);
	initLauncherCmd(context);

	initTasksView(context);
	initResourceView(context);
	initLauncherView(context);
	

}

export function deactivate() {}
