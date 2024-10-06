import * as vscode from 'vscode';

export class InfoItem extends vscode.TreeItem {
    constructor(label: string | vscode.TreeItemLabel, description?: string | boolean, tooltip?: string | vscode.MarkdownString) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = description;
        this.tooltip = tooltip;
    }
}

