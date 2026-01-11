import * as vscode from 'vscode';
// eslint-disable-next-line @typescript-eslint/naming-convention
import _ from 'lodash';

import { Node, NodeState, ResourceGres } from '../models/';
import { GresItem, NodeItem } from './components';
import { configService, GresSortKeys, GresGroupKeys, resourceService } from '../services';
import { resignFn } from '../utils/utils';


const nodeSortFnMap = new Map([
    [GresSortKeys.NAME, (a: Node, b: Node) => a.nodeid.localeCompare(b.nodeid, undefined, { sensitivity: 'base' })],
    [GresSortKeys.AVAIL, (a: Node, b: Node) => a.gres === null || b.gres === null ? 0 : (!a.isAvailableState ? -1 : (!b.isAvailableState ? 1 : (a.gres.totalNum - a.gres.usedNum) - (b.gres.totalNum - b.gres.usedNum)))],
]);

const gresSortFnMap = new Map([
    [GresSortKeys.NAME, (a: ResourceGres | null, b: ResourceGres | null) => a === null ? -1 : (b === null ? 1 : a.toIdString().localeCompare(b.toIdString(), undefined, { sensitivity: 'base' }))],
    [GresSortKeys.AVAIL, (a: ResourceGres | null, b: ResourceGres | null) => a === null ? -1 : (b === null ? 1 : (a.totalNum - a.usedNum) - (b.totalNum - b.usedNum))],
]);

function getNodeGroupedByGres(): GresItem[] {
    const gresNode = resourceService.getNodesByGres();

    const gresSortFn = resignFn(gresSortFnMap.get(configService.gresSortKey)!, configService.gresSortAscending);
    const sortedMap = [...gresNode].sort((a, b) => gresSortFn(a[1].gres, b[1].gres));

    return sortedMap.map(([gresId, group]) => {
        return new GresItem(group.gres, group.nodes);
    });
}

function getNodeGroupedByPartition(): GresItem[] {
    const partitionNode = resourceService.getNodeByPartition();

    const gresSortFn = resignFn(gresSortFnMap.get(configService.gresSortKey)!, configService.gresSortAscending);

    const sortedMap = [...partitionNode].sort((a, b) => gresSortFn(a[1].gres, b[1].gres));

    return sortedMap.map(([partition, group]) => {
        return new GresItem(group.gres, group.nodes, `${partition} (${group.gres!.totalNum - group.gres!.usedNum}/${group.gres!.totalNum})`);
    });
}

const getGroupedNodeFn = {
    [GresGroupKeys.GRES]: getNodeGroupedByGres,
    [GresGroupKeys.PARTITION]: getNodeGroupedByPartition,
};

export class ResourceViewDataProvider implements vscode.TreeDataProvider<NodeItem | GresItem> {
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

    getTreeItem(element: NodeItem | GresItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: NodeItem | GresItem): Thenable<GresItem[] | NodeItem[]> {
        if (!element) {
            return Promise.resolve(getGroupedNodeFn[configService.gresGroupKey]());
        }
        if (element instanceof GresItem) {
            const nodeSortFn = resignFn(nodeSortFnMap.get(configService.gresSortKey)!, configService.gresSortAscending);
            return Promise.resolve(element.nodes.sort(nodeSortFn).map(v => new NodeItem(v)));
        }
        return Promise.resolve([]);
    }
}

export const resourceViewDataProvider = ResourceViewDataProvider.getInstance();
export let resourceTreeView: vscode.TreeView<GresItem | NodeItem>;

export function initResourceView(context: vscode.ExtensionContext) {
    resourceTreeView = vscode.window.createTreeView('slurm--_resource_view', { treeDataProvider: resourceViewDataProvider });
    context.subscriptions.push(resourceTreeView);
}
