import * as vscode from 'vscode';

import { executeCmd } from '../utils/utils';
import { Script } from '../models';
import { launcherViewDataProvider } from '../view/launcherView';
import { scriptService } from '../services';
import { ScriptItem, ListItem, NodeItem } from '../view/components';

export async function refreshLauncher() {
    scriptService.loadScript();
    launcherViewDataProvider.refresh();
}

export async function launchScript(script: ScriptItem) {
    const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.path ?? '~/';
    const [out, err] = await executeCmd(`cd ${workspacePath}\nsbatch ${script.script.uri.path}`);
    vscode.window.showInformationMessage(out);
}

export async function removeScript(script: ScriptItem) {
    scriptService.deleteScript(script.script);
    launcherViewDataProvider.refresh();
}

export async function addScript(uriList: string[]) {
    scriptService.addScript(...uriList.map(v => new Script(v)));
    launcherViewDataProvider.refresh();
}


export function initLauncherCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.refreshLauncher', refreshLauncher));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.launchScript', launchScript));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.removeScript', removeScript));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.addScript', addScript));

    vscode.commands.executeCommand('slurm--.refreshLauncher');
}
