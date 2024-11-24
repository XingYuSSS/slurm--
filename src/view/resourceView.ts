import * as vscode from 'vscode';

import { NodeState, ResourceGres } from '../models/';
import { ListItem, NodeItem } from './components';
import { resourceService } from '../services';

const emptyGresIcon = new vscode.ThemeIcon('close', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'));

function gresIcon(gres: ResourceGres): vscode.ThemeIcon {
    if (gres.usedNum === 0) { return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.addedResourceForeground')); }
    if (gres.usedNum < gres.totalNum) { return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground')); }
    return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'));
}

function getGroupedNode(): ListItem[] {
    return [...resourceService.groupByGres().values()].map(nodes => {
        if (nodes[0].gres === null) { return new ListItem('No GRES', nodes.map(v => new NodeItem(v)), vscode.l10n.t('${length} nodes'), undefined, 'gresList', false); }
        const availNode = nodes.filter(v => v.state === NodeState.MIXED || v.state === NodeState.IDLE);
        if (availNode.length === 0) { return new ListItem(nodes[0].gres.toIdString() + ' (0/0)', nodes.map(v => new NodeItem(v)), vscode.l10n.t('${length} nodes'), emptyGresIcon, 'gresList', false); }
        const rgres = ResourceGres.fromArray(availNode.map(v => v.gres!));
        return new ListItem(rgres.toString(), nodes.map(v => new NodeItem(v)), vscode.l10n.t('${length} nodes'), gresIcon(rgres), 'gresList', false);
    });
}

export class ResourceViewDataProvider implements vscode.TreeDataProvider<NodeItem | ListItem> {
    private static _instance: ResourceViewDataProvider | null = null;
    private constructor() { }

    static getInstance() {
        if (ResourceViewDataProvider._instance === null) {
            ResourceViewDataProvider._instance = new ResourceViewDataProvider();
        }
        return ResourceViewDataProvider._instance;
    }

    private _onDidChangeTreeData: vscode.EventEmitter<NodeItem | undefined | null | void> = new vscode.EventEmitter<NodeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<NodeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: NodeItem | ListItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: NodeItem | ListItem): Thenable<ListItem[] | NodeItem[]> {
        if (!element) {
            return Promise.resolve(getGroupedNode());
        }
        if (element instanceof ListItem) {
            return Promise.resolve(element.children as NodeItem[]);
        }
        return Promise.resolve([]);
    }
}

export const resourceViewDataProvider = ResourceViewDataProvider.getInstance();
export let resourceTreeView: vscode.TreeView<ListItem | NodeItem>;

export function initResourceView(context: vscode.ExtensionContext) {
    resourceTreeView = vscode.window.createTreeView('slurm--_resource_view', { treeDataProvider: resourceViewDataProvider });
    context.subscriptions.push(resourceTreeView);
}
