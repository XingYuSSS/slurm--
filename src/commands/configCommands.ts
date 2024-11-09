import * as vscode from 'vscode';

export async function openConfig() {
    
}

export function initConfigCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.openConfig', openConfig));
}
