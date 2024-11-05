import * as vscode from 'vscode';
import { Script } from '../../models';

export class ScriptItem extends vscode.TreeItem {
    constructor(public readonly script: Script) {
        super(script.name, vscode.TreeItemCollapsibleState.Collapsed);
        this.description = script.relativePath;
        this.contextValue = 'scriptItem';
        this.command = { command: 'slurm--.openFile', title: 'open', arguments: [script] };
        this.iconPath = new vscode.ThemeIcon('file-code');
    }
}
