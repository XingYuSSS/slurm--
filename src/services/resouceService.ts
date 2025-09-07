import * as vscode from 'vscode';

import { Node } from '../models';

export class ResourceService {
    private nodeList: Node[] = [];

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
}

export const resourceService: ResourceService = ResourceService.getInstance();

