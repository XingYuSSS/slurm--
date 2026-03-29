import * as vscode from 'vscode';

import { Node, ResourceGres } from '../../models';
import { nodeGresDisplay } from './nodeItem';

function gresIcon(gres: ResourceGres): vscode.ThemeIcon {
    if (gres.totalNum === 0) { return new vscode.ThemeIcon('close', new vscode.ThemeColor('gitDecoration.deletedResourceForeground')); }
    if (gres.usedNum === 0) { return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.addedResourceForeground')); }
    if (gres.usedNum < gres.totalNum) { return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground')); }
    return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'));
}

function gresTooltip(nodes: Node[]): vscode.MarkdownString {
    return new vscode.MarkdownString(`
| nodeid | state | GRES (idle/total) | memory (i/t) | CPUs (i/t) |
|:--:|:--:|:--:|:--:|:--:|
${nodes.slice(0, 10).map(node => `| ${node.nodeid} | ${node.state} | ${nodeGresDisplay(node)} | ${Math.round((node.memory - node.allocMemory) * 1000) / 1000}GB / ${node.memory}GB | ${node.idleCpu} / ${node.cpu} |`).join('\n')}
${nodes.length > 10 ? '|...|...|...|...|...|' : ''}
    `);
}


export class GresItem extends vscode.TreeItem {
    constructor(public readonly gres: ResourceGres | null, public readonly nodes: Node[], title?: string) {
        super(title ?? gres?.toString() ?? 'No GRES', vscode.TreeItemCollapsibleState.Collapsed);
        this.iconPath = gres ? gresIcon(gres) : undefined;
        this.description = vscode.l10n.t('{length} nodes', { length: nodes.length });
        this.tooltip = gresTooltip(nodes);
        this.contextValue = 'gresList';
    }
}