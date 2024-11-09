import * as vscode from 'vscode';

function getOpenConfig(context: vscode.ExtensionContext) {
    return () => {
        vscode.commands.executeCommand('workbench.action.openSettings', `@ext:${context.extension.id}`);
    };
}

export function initConfigCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.openConfig', getOpenConfig(context)));
}
