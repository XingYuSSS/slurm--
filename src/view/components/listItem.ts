import * as vscode from 'vscode';

export class ListItem extends vscode.TreeItem {
    constructor(public readonly title: string, public readonly children: vscode.TreeItem[], description: string, iconPath?: vscode.ThemeIcon, contextValue?: string, isExpanded: boolean = true) {
        super(title, isExpanded ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);
        this.description = description.replace('${length}', children.length.toString());
        this.iconPath = iconPath;
        this.contextValue = contextValue;
    }
}