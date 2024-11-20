import * as vscode from 'vscode';
import { Script } from '../../models';

export class ArgItem extends vscode.TreeItem {
    constructor(public readonly script: Script, public readonly argIndex: number) {
        super(script.args[argIndex], vscode.TreeItemCollapsibleState.None);
        this.contextValue = 'argItem';
    }
}

export class AddArgItem extends vscode.TreeItem {
    constructor(public readonly script: Script) {
        super(vscode.l10n.t('Add Argument'), vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon('add');
        this.command = { command: 'slurm--.addArg', title: 'add argument', arguments: [script] };
    }
}
