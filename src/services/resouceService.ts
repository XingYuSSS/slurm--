import * as vscode from 'vscode';

import { Node, Gres } from '../models';

export class ResourceService {
    private nodeList!: Node[];

    private static _instance: ResourceService | null = null;
    private constructor() { }

    static getInstance(): ResourceService {
        if (ResourceService._instance === null) {
            ResourceService._instance = new ResourceService();
        }

        return ResourceService._instance;
    }

    public updateNode(...nodes: Node[]) {
        this.nodeList = nodes;
    }

    public getNode(): Node[] {
        return this.nodeList;
    }

    public groupByGres(): Map<String, Node[]> {
        return this.nodeList.reduce((group, node) => {
            const gresId = node.gres.toIdString();
            if (!group.has(gresId)) {
                group.set(gresId, []);
            }
            group.get(gresId)?.push(node);
            return group;
        }, new Map<String, Node[]>());
    }

}

export const resourceService: ResourceService = ResourceService.getInstance();

