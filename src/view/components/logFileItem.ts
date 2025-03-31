import * as vscode from 'vscode';
import { LogFile } from '../../models';

export class LogFileItem extends vscode.TreeItem {
    constructor(public readonly file: LogFile, description?: string | boolean, tooltip?: string | vscode.MarkdownString, showNameOnly: boolean = true) {
        super(showNameOnly ? file.name : file.uri.path, vscode.TreeItemCollapsibleState.None);
        this.description = description;
        this.tooltip = tooltip;
        this.contextValue = 'openableFile';
        this.command = { command: 'slurm--.openFile', title: 'open', arguments: [file] };
    }
}
