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
    const arg = await vscode.window.showInputBox({ prompt: 'new argument' });
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
    const newArg = await vscode.window.showInputBox({ prompt: 'change argument', value: arg.script.args[arg.argIndex] });
    if (newArg) {
        arg.script.args[arg.argIndex] = newArg;
        scriptService.saveScript();
    }
    launcherViewDataProvider.refresh();
}

export async function launchTerminal(node: NodeItem) {
    let gresArg = '';
    if (node.node.gres) {
        const gresNum = await vscode.window.showQuickPick(Array.from({ length: node.node.gres.totalNum - node.node.gres.usedNum + 1 }, (_, i) => i).map(v => v.toString()), { title: 'Choose number of GRES' });
        if (!gresNum) { return; }
        gresArg = "--gres=" + node.node.gres.toIdString() + ":" + gresNum;
    }
    let mem = undefined;
    while (!mem) {
        mem = await vscode.window.showQuickPick(Array.from({ length: Math.floor((node.node.memory - node.node.allocMemory) / 50) }, (_, i) => (i + 1) * 50).map(v => `${v}G`).concat(['Custom...']), { title: 'Choose memory to alloc' });
        if (!mem) { return; }
        if (mem === 'Custom...') {
            mem = await vscode.window.showInputBox({ prompt: 'Custom memory' });
        }
    }
    let time = undefined;
    while (!time) {
        time = await vscode.window.showQuickPick(Array.from({ length: 8 }, (_, i) => i + 1).map(v => `${v}:00:00`).concat(['Custom...']), { title: 'Choose time' });
        if (!time) { return; }
        if (time === 'Custom...') {
            time = await vscode.window.showInputBox({ prompt: 'Custom time' });
        }
    }
    let shell = undefined;
    while (!shell) {
        shell = await vscode.window.showQuickPick(['zsh', 'bash', 'Custom...'], { title: 'Choose shell' });
        if (!shell) { return; }
        if (shell === 'Custom...') {
            shell = await vscode.window.showInputBox({ prompt: 'Custom shell' });
        }
    }
    const terminal = vscode.window.createTerminal();
    terminal.show();
    terminal.sendText(`srun ${gresArg} --nodelist=${node.node.nodeid} --mem ${mem} -t ${time} --pty ${shell} -i`);
}


export function initLauncherCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.refreshLauncher', refreshLauncher));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.launchScript', launchScript));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.removeScript', removeScript));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.addScript', addScript));

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.addArg', addArg));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.deleteArg', deleteArg));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.changeArg', changeArg));

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.launchTerminal', launchTerminal));

    vscode.commands.executeCommand('slurm--.refreshLauncher');
}
