import * as vscode from 'vscode';
import { Node } from '../../models';

function nodeDescription(node: Node): string {
    return `${node.gres ?? 'No GRES'}\t${node.allocMemory}GB/${node.memory}GB`;
}

function nodeIcon(node: Node): vscode.ThemeIcon | undefined {
    if (node.gres === null) { return undefined; }
    if (node.gres.usedNum === 0) { return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.addedResourceForeground')); }
    if (node.gres.usedNum < node.gres.totalNum) { return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground')); }
    return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'));
}

export class NodeItem extends vscode.TreeItem {
    constructor(public readonly node: Node) {
        super(node.nodeid, vscode.TreeItemCollapsibleState.None);
        this.description = nodeDescription(node);
        this.iconPath = nodeIcon(node);
        this.contextValue = 'nodeItem';
    }
}