import * as vscode from 'vscode';

import { executeCmd, findFiles, withDelayedProgress } from '../utils/utils';
import { Script } from '../models';
import { launcherViewDataProvider } from '../view/launcherView';
import { configService, localScriptService, globalScriptService } from '../services';
import { ScriptItem, ListItem, NodeItem, ArgItem } from '../view/components';

async function refreshLauncher() {
    localScriptService?.loadScript();
    globalScriptService.loadScript();
    launcherViewDataProvider.refresh();
}

async function extractScripts(uriList: vscode.Uri[]): Promise<vscode.Uri[]> {
    return await withDelayedProgress(
        {
            delayMs: 500,
            location: vscode.ProgressLocation.Notification,
            title: vscode.l10n.t('Extracting scripts...'),
            cancellable: false
        },
        async () => {
            const scripts = uriList.map(async (uri) => {
                const stat = await vscode.workspace.fs.stat(uri);
                if (stat.type !== vscode.FileType.Directory) {
                    return [uri];
                }
                return await findFiles(uri.path, configService.scriptsExtList);
            });
            return (await Promise.all(scripts)).flat();
        }
    );
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
    const scriptService = script.script.isLocal ? localScriptService! : globalScriptService;
    scriptService.deleteScript(script.script);
    launcherViewDataProvider.refresh();
}

async function addScript(uriList: vscode.Uri[], isLocal: boolean) {
    const scriptService = isLocal ? localScriptService! : globalScriptService;

    const scripts = await extractScripts(uriList);

    if (scripts.length === 0) {
        vscode.window.showWarningMessage(vscode.l10n.t('No scripts in selected folder, please check your "Extension List" setting'));
        return;
    }

    if (scripts.length > 1) {
        const result = await vscode.window.showWarningMessage(
            vscode.l10n.t(`This will add {0} scripts below: `, scripts.length) + scripts.map(v => v.path).join('; '),
            vscode.l10n.t('Yes'),
            vscode.l10n.t('No')
        );
        if (result !== vscode.l10n.t('Yes')) { return; }
    }

    scriptService.addScript(...scripts.map(v => new Script(v, isLocal)));
    launcherViewDataProvider.refresh();
}

async function addScriptFile(isLocal: boolean) {
    const uriList = await vscode.window.showOpenDialog({ canSelectMany: true, title: 'script file' });
    if (!uriList) { return; }

    const scriptService = isLocal ? localScriptService! : globalScriptService;
    scriptService.addScript(...uriList.map(v => new Script(v, isLocal)));
    launcherViewDataProvider.refresh();
}

async function addScriptFolder(isLocal: boolean) {
    const uriList = await vscode.window.showOpenDialog({
        canSelectFolders: true,
        title: 'script folder'
    });
    if (!uriList) { return; }

    const scriptService = isLocal ? localScriptService! : globalScriptService;
    const scripts = await extractScripts(uriList);

    if (scripts.length === 0) {
        vscode.window.showWarningMessage(vscode.l10n.t('No scripts in selected folder, please check your "Extension List" setting'));
        return;
    }

    const result = await vscode.window.showWarningMessage(
        vscode.l10n.t(`This will add {0} scripts below: `, scripts.length) + scripts.map(v => v.path).join('; '),
        vscode.l10n.t('Yes'),
        vscode.l10n.t('No')
    );

    if (result === vscode.l10n.t('Yes')) {
        scriptService.addScript(...scripts.map(v => new Script(v, isLocal)));
        launcherViewDataProvider.refresh();
    }
}

async function addArg(script: Script) {
    const arg = await vscode.window.showInputBox({ prompt: vscode.l10n.t('new argument') });
    if (arg) {
        script.args.push(arg);
        const scriptService = script.isLocal ? localScriptService! : globalScriptService;
        scriptService.saveScript();
    }
    launcherViewDataProvider.refresh();
}

async function deleteArg(arg: ArgItem) {
    arg.script.args.splice(arg.argIndex, 1);
    const scriptService = arg.script.isLocal ? localScriptService! : globalScriptService;
    scriptService.saveScript();
    launcherViewDataProvider.refresh();
}

async function changeArg(arg: ArgItem) {
    const newArg = await vscode.window.showInputBox({ prompt: vscode.l10n.t('change argument'), value: arg.script.args[arg.argIndex] });
    if (newArg) {
        arg.script.args[arg.argIndex] = newArg;
        const scriptService = arg.script.isLocal ? localScriptService! : globalScriptService;
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
    let cpu = undefined;
    while (!cpu) {
        cpu = await vscode.window.showQuickPick(Array.from({ length: Math.floor(Math.log2(node.node.idleCpu)) + 1 }, (_, i) => (2 ** i)).map(v => `${v}`).concat([vscode.l10n.t('Custom...')]), { title: vscode.l10n.t('Choose CPUs to alloc') });
        if (!cpu) { return; }
        if (cpu === vscode.l10n.t('Custom...')) {
            cpu = await vscode.window.showInputBox({ prompt: vscode.l10n.t('Custom CPU') });
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
        shell = await vscode.window.showQuickPick([...configService.terminalShellList, vscode.l10n.t('Custom...')], { title: vscode.l10n.t('Choose shell') });
        if (!shell) { return; }
        if (shell === vscode.l10n.t('Custom...')) {
            shell = await vscode.window.showInputBox({ prompt: vscode.l10n.t('Custom shell') });
        }
    }
    const terminal = vscode.window.createTerminal();
    terminal.show();
    terminal.sendText(`srun ${gresArg} -p ${node.node.partition} --nodelist=${node.node.nodeid} --mem ${mem} -t ${time} --cpus-per-task ${cpu} --pty ${shell} -i`);
}

async function enqueueCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active file to queue');
        return;
    }

    const document = editor.document;

    if (document.isDirty) {
        await document.save();
    }

    launchScript(new ScriptItem(new Script(document.uri, true)));
}

async function enqueueScript(uri: vscode.Uri) {
    const filePath = uri.fsPath;

    launchScript(new ScriptItem(new Script(filePath, true)));
}


export function initLauncherCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.refreshLauncher', refreshLauncher));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.launchScript', launchScript));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.removeScript', removeScript));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.addScript', addScript));

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.addLocalScriptFile', () => addScriptFile(true)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.addGlobalScriptFile', () => addScriptFile(false)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.addLocalScriptFolder', () => addScriptFolder(true)));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.addGlobalScriptFolder', () => addScriptFolder(false)));

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.addArg', addArg));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.deleteArg', deleteArg));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.changeArg', changeArg));

    context.subscriptions.push(vscode.commands.registerCommand('slurm--.launchTerminal', launchTerminal));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.enqueueCurrentFile', enqueueCurrentFile));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.enqueueScript', enqueueScript));
}
