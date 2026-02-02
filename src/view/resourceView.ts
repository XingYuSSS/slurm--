import * as vscode from 'vscode';
// eslint-disable-next-line @typescript-eslint/naming-convention
import _ from 'lodash';

import { Node, NodeState, ResourceGres } from '../models';
import { GresItem, NodeItem } from './components';
import { configService, GresSortKeys, GresGroupKeys, resourceService } from '../services';

function getNodeGroupedByGres(): GresItem[] {
    const gresNode = resourceService.getNodesByGres();
    const sortedMap = [...gresNode].sort((a, b) => configService.gresSortFN(a[1].gres, b[1].gres));

    return sortedMap.map(([gresId, group]) => {
        return new GresItem(group.gres, group.nodes);
    });
}

function getNodeGroupedByPartition(): GresItem[] {
    const partitionNode = resourceService.getNodeByPartition();
    const sortedMap = [...partitionNode].sort((a, b) => configService.gresSortFN(a[1].gres, b[1].gres));

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
            return Promise.resolve(element.nodes.sort(configService.nodeSortFN).map(v => new NodeItem(v)));
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
