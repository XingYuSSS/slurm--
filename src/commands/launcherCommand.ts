import * as vscode from 'vscode';

import { executeCmd } from '../utils/utils';
import { Script } from '../models';
import { launcherViewDataProvider } from '../view/launcherView';
import { scriptService } from '../services';
import { ScriptItem, ListItem, NodeItem, ArgItem } from '../view/components';

export async function refreshLauncher() {
    scriptService.loadScript();
    launcherViewDataProvider.refresh();
}

export async function launchScript(script: ScriptItem) {
    const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.path ?? '~/';
    const [out, err] = await executeCmd(`cd ${workspacePath}\nsbatch ${script.script.uri.path} ${script.script.args.join(' ')}`);
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

export async function addArg(script: Script) {
    const arg = await vscode.window.showInputBox({prompt: 'new argument'});
    if (arg) {
        script.args.push(arg);
        scriptService.saveScript();
    }
    launcherViewDataProvider.refresh();
}

export async function deleteArg(arg: ArgItem) {
    arg.script.args.splice(arg.argIndex, 1);
    scriptService.saveScript();
    launcherViewDataProvider.refresh();
}

export async function changeArg(arg: ArgItem) {
    const newArg = await vscode.window.showInputBox({prompt: 'change argument', value: arg.script.args[arg.argIndex]});
    if (newArg) {
        arg.script.args[arg.argIndex] = newArg;
        scriptService.saveScript();
    }
    launcherViewDataProvider.refresh();
}


export function initLauncherCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.refreshLauncher', refreshLauncher));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.launchScript', launchScript));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.removeScript', removeScript));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.addScript', addScript));

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.addArg', addArg));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.deleteArg', deleteArg));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.changeArg', changeArg));

    vscode.commands.executeCommand('slurm--.refreshLauncher');
}
