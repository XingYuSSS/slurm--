import * as vscode from 'vscode';

import { executeCmd } from '../utils/utils';
import { Script } from '../models';
import { launcherViewDataProvider } from '../view/launcherView';
import { scriptService } from '../services';
import { ScriptItem, ListItem, NodeItem, ArgItem } from '../view/components';

async function refreshLauncher() {
    scriptService.loadScript();
    launcherViewDataProvider.refresh();
}

async function launchScript(script: ScriptItem) {
    const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.path ?? '~/';
    const [out, err] = await executeCmd(`cd ${workspacePath}\nsbatch ${script.script.uri.path} ${script.script.args.join(' ')}`);
    if (err) {
        vscode.window.showErrorMessage(err);
        return;
    }
    vscode.window.showInformationMessage(out);
    vscode.commands.executeCommand('slurm--.refreshUserTasks');
}

async function removeScript(script: ScriptItem) {
    scriptService.deleteScript(script.script);
    launcherViewDataProvider.refresh();
}

async function addScript(uriList: string[]) {
    scriptService.addScript(...uriList.map(v => new Script(v)));
    launcherViewDataProvider.refresh();
}

async function addArg(script: Script) {
    const arg = await vscode.window.showInputBox({ prompt: vscode.l10n.t('new argument') });
    if (arg) {
        script.args.push(arg);
        scriptService.saveScript();
    }
    launcherViewDataProvider.refresh();
}

async function deleteArg(arg: ArgItem) {
    arg.script.args.splice(arg.argIndex, 1);
    scriptService.saveScript();
    launcherViewDataProvider.refresh();
}

async function changeArg(arg: ArgItem) {
    const newArg = await vscode.window.showInputBox({ prompt: vscode.l10n.t('change argument'), value: arg.script.args[arg.argIndex] });
    if (newArg) {
        arg.script.args[arg.argIndex] = newArg;
        scriptService.saveScript();
    }
    launcherViewDataProvider.refresh();
}

async function launchTerminal(node: NodeItem) {
    let gresArg = '';
    if (node.node.gres) {
        const gresNum = await vscode.window.showQuickPick(Array.from({ length: node.node.gres.totalNum - node.node.gres.usedNum + 1 }, (_, i) => i).map(v => v.toString()), { title: vscode.l10n.t('Choose number of GRES') });
        if (!gresNum) { return; }
        gresArg = "--gres=" + node.node.gres.toIdString() + ":" + gresNum;
    }
    let mem = undefined;
    while (!mem) {
        mem = await vscode.window.showQuickPick(Array.from({ length: Math.floor((node.node.memory - node.node.allocMemory) / 50) }, (_, i) => (i + 1) * 50).map(v => `${v}G`).concat([vscode.l10n.t('Custom...')]), { title: vscode.l10n.t('Choose memory to alloc') });
        if (!mem) { return; }
        if (mem === vscode.l10n.t('Custom...')) {
            mem = await vscode.window.showInputBox({ prompt: vscode.l10n.t('Custom memory') });
        }
    }
    let time = undefined;
    while (!time) {
        time = await vscode.window.showQuickPick(Array.from({ length: 8 }, (_, i) => i + 1).map(v => `${v}:00:00`).concat([vscode.l10n.t('Custom...')]), { title: vscode.l10n.t('Choose time') });
        if (!time) { return; }
        if (time === vscode.l10n.t('Custom...')) {
            time = await vscode.window.showInputBox({ prompt: vscode.l10n.t('Custom time') });
        }
    }
    let shell = undefined;
    while (!shell) {
        shell = await vscode.window.showQuickPick(['zsh', 'bash', vscode.l10n.t('Custom...')], { title: vscode.l10n.t('Choose shell') });
        if (!shell) { return; }
        if (shell === vscode.l10n.t('Custom...')) {
            shell = await vscode.window.showInputBox({ prompt: vscode.l10n.t('Custom shell') });
        }
    }
    const terminal = vscode.window.createTerminal();
    terminal.show();
    terminal.sendText(`srun ${gresArg} -p ${node.node.partition} --nodelist=${node.node.nodeid} --mem ${mem} -t ${time} --pty ${shell} -i`);
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
