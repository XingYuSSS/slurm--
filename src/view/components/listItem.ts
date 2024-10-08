import * as vscode from 'vscode';

export class ListItem extends vscode.TreeItem {
    constructor(public readonly title: string, public readonly children: vscode.TreeItem[], contextValue?: string, isExpanded: boolean = true) {
        super(title, isExpanded ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);
        this.description = `${children.length} tasks`;
        this.contextValue = contextValue;
    }
}