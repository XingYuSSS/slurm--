import * as vscode from 'vscode';

import { Node, NodeState, ResourceGres } from '../models/';
import { ListItem, NodeItem } from './components';
import { configService, GresSortKeys, resourceService } from '../services';
import { resignFn } from '../utils/utils';

function gresIcon(gres: ResourceGres): vscode.ThemeIcon {
    if (gres.totalNum === 0) { return new vscode.ThemeIcon('close', new vscode.ThemeColor('gitDecoration.deletedResourceForeground')); }
    if (gres.usedNum === 0) { return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.addedResourceForeground')); }
    if (gres.usedNum < gres.totalNum) { return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground')); }
    return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'));
}

const nodeSortFn = new Map([
    [GresSortKeys.NAME, (a: Node, b: Node) => a.nodeid.localeCompare(b.nodeid, undefined, { sensitivity: 'base' })],
    [GresSortKeys.AVAIL, (a: Node, b: Node) => a.gres === null || b.gres === null ? 0 : (!a.isAvailableState ? -1 : (!b.isAvailableState ? 1 : (a.gres.totalNum - a.gres.usedNum) - (b.gres.totalNum - b.gres.usedNum)))],
]);

const listSortFn = new Map([
    [GresSortKeys.NAME, (a: ResourceGres | null, b: ResourceGres | null) => a === null ? -1 : (b === null ? 1 : a.toIdString().localeCompare(b.toIdString(), undefined, { sensitivity: 'base' }))],
    [GresSortKeys.AVAIL, (a: ResourceGres | null, b: ResourceGres | null) => a === null ? -1 : (b === null ? 1 : (a.totalNum - a.usedNum) - (b.totalNum - b.usedNum))],
]);

function getGroupedNode(): ListItem[] {
    return [...resourceService.groupByGres().values()]
        .map(nodes => {
            if (nodes[0].gres === null) {
                return [null, new ListItem('No GRES', nodes.map(v => new NodeItem(v)), vscode.l10n.t('${length} nodes'), undefined, 'gresList', false)];
            }
            nodes = nodes.sort(resignFn(nodeSortFn.get(configService.gresSortKey)!, configService.gresSortAscending));
            const availNode = nodes.filter(v => v.isAvailableState);
            const rgres = availNode.length === 0 ? ResourceGres.empty(nodes[0]!.gres.toIdString()) : ResourceGres.fromArray(availNode.map(v => v.gres!));
            return [rgres, new ListItem(rgres.toString(), nodes.map(v => new NodeItem(v)), vscode.l10n.t('${length} nodes'), gresIcon(rgres), 'gresList', false)];
        })
        .sort((a, b) => resignFn(listSortFn.get(configService.gresSortKey)!, configService.gresSortAscending)(a[0] as ResourceGres | null, b[0] as ResourceGres | null))
        .map(item => item[1]) as ListItem[];
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
