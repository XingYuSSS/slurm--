import * as vscode from 'vscode';
import { Node, NodeState } from '../../models';

export function nodeGresDisplay(node: Node): string {
    return node.gresList.length === 0 ? 'No GRES' : node.gresList.map((g) => g.toString()).join(', ');
}

function nodeDescription(node: Node): string {
    if (node.state === NodeState.ALLOC) { return vscode.l10n.t(`Node has been allocated`); }
    if (node.state === NodeState.IDLE || node.state === NodeState.MIXED) {
        return `${nodeGresDisplay(node)} \t${Math.round((node.memory - node.allocMemory) * 1000) / 1000}GB / ${node.memory}GB \t${node.idleCpu} / ${node.cpu} CPUs`;
    }
    return vscode.l10n.t(`Node not available due to state "{0}"`, node.state);
}

function nodeIcon(node: Node): vscode.ThemeIcon | undefined {
    if (node.gresList.length === 0) { return undefined; }
    if (node.state === NodeState.ALLOC) { return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.deletedResourceForeground')); }
    if (node.state === NodeState.IDLE || node.state === NodeState.MIXED) {
        const anyFree = node.gresList.some((g) => g.usedNum < g.totalNum);
        const allUnused = node.gresList.every((g) => g.usedNum === 0);
        if (allUnused) { return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.addedResourceForeground')); }
        if (anyFree) { return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground')); }
        return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'));
    }
    return new vscode.ThemeIcon('close', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'));
}

function nodeTooltip(node: Node): vscode.MarkdownString {
    return new vscode.MarkdownString(`
| nodeid | state | GRES (idle/total) | memory (i/t) | CPUs (i/t) |
|:--:|:--:|:--:|:--:|:--:|
| ${node.nodeid} | ${node.state} | ${nodeGresDisplay(node)} | ${Math.round((node.memory - node.allocMemory) * 1000) / 1000}GB / ${node.memory}GB | ${node.idleCpu} / ${node.cpu} |
    `);
}

export class NodeItem extends vscode.TreeItem {
    constructor(public readonly node: Node) {
        super(node.nodeid, vscode.TreeItemCollapsibleState.None);
        this.description = nodeDescription(node);
        this.tooltip = nodeTooltip(node);
        this.iconPath = nodeIcon(node);
        this.contextValue = (node.state === NodeState.IDLE || node.state === NodeState.MIXED) ? 'nodeItem' : 'unavailNodeItem';
    }
}
