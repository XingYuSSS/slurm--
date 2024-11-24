import * as vscode from 'vscode';
import { Node, NodeState } from '../../models';

function nodeDescription(node: Node): string {
    if (node.state === NodeState.ALLOC) { return vscode.l10n.t(`Node has been allocated`); }
    if (node.state === NodeState.IDLE || node.state === NodeState.MIXED) {
        return `${node.gres ?? 'No GRES'}\t${node.allocMemory}GB/${node.memory}GB`;
    }
    return vscode.l10n.t(`Node not available due to state "{0}"`, node.state);
}

function nodeIcon(node: Node): vscode.ThemeIcon | undefined {
    if (node.gres === null) { return undefined; }
    if (node.state === NodeState.ALLOC) { return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.deletedResourceForeground')); }
    if (node.state === NodeState.IDLE || node.state === NodeState.MIXED) {
        if (node.gres.usedNum === 0) { return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.addedResourceForeground')); }
        if (node.gres.usedNum < node.gres.totalNum) { return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground')); }
        return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'));
    }
    return new vscode.ThemeIcon('close', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'));
}

export class NodeItem extends vscode.TreeItem {
    constructor(public readonly node: Node) {
        super(node.nodeid, vscode.TreeItemCollapsibleState.None);
        this.description = nodeDescription(node);
        this.tooltip = `${node.nodeid} state: ${node.state}`;
        this.iconPath = nodeIcon(node);
        this.contextValue = (node.state === NodeState.IDLE || node.state === NodeState.MIXED) ? 'nodeItem' : 'unavailNodeItem';
    }
}
