import * as vscode from 'vscode';

import { ResourceGres, Node } from '../models';

interface GresGroup {
    nodes: Node[],
    gres: ResourceGres | null
}

export class ResourceService {
    private nodeList: Node[] = [];

    private gresMap: Map<string | null, GresGroup> | null = null;
    private partitionMap: Map<string, GresGroup> | null = null;
    private partitionGresMap: Map<string, Map<string | null, GresGroup>> | null = null;

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

        this.gresMap = null;
        this.partitionMap = null;
    }

    public getNode(): Node[] {
        return this.nodeList;
    }


    private _groupNodeByGres(nodes: Node[]): Map<string | null, GresGroup> {
        const map = new Map<string | null, GresGroup>();
        nodes.forEach(node => {
            if (node.gresList.length === 0) {
                if (!map.has(null)) {
                    map.set(null, { nodes: [], gres: null });
                }
                map.get(null)!.nodes.push(node);
                return;
            }
            for (const rg of node.gresList) {
                const gresId = rg.toIdString();
                if (!map.has(gresId)) {
                    map.set(gresId, { nodes: [], gres: null });
                }
                map.get(gresId)!.nodes.push(node);
            }
        });

        [...map]
            .filter(([gresId, group]) => gresId !== null)
            .forEach(([gresId, group]) => {
                const availNode = group.nodes.filter(v => v.isAvailableState);
                const gres = availNode.length === 0
                    ? ResourceGres.empty(gresId!)
                    : ResourceGres.fromArray(availNode.map((v) => v.gresList.find((g) => g.toIdString() === gresId)!));
                group.gres = gres;
            });
        return map;
    }

    private _groupNodeByPartition(nodes: Node[]): Map<string, Node[]> {
        const map = new Map<string, Node[]>();
        nodes.forEach(node => {
            if (!map.has(node.partition)) {
                map.set(node.partition, []);
            }
            map.get(node.partition)!.push(node);
        });
        return map;
    }


    public getNodesByGres(): Map<string | null, GresGroup> {
        if (!this.gresMap) {
            this.gresMap = this._groupNodeByGres(this.nodeList);
        }
        return this.gresMap;
    }

    public getNodeByPartition(): Map<string, GresGroup> {
        if (!this.partitionMap) {
            const map = this._groupNodeByPartition(this.nodeList);

            const pmap = new Map<string, GresGroup>(
                [...map].map(([partition, nodes]) => {
                    const availNode = nodes.filter(v => v.isAvailableState && v.gresList.length !== 0);
                    const gres = availNode.length === 0
                        ? ResourceGres.empty('')
                        : ResourceGres.fromArray(availNode.map(v => v.gresList.reduce((a, b) => a.add(b), ResourceGres.empty(''))));
                    return [partition, { nodes: nodes, gres: gres }];
                }));
            this.partitionMap = pmap;
        }
        return this.partitionMap;
    }

    public getNodeByPartitionGres(): Map<string, Map<string | null, GresGroup>> {
        if (!this.partitionGresMap) {
            const map = this._groupNodeByPartition(this.nodeList);

            const pmap = new Map<string, Map<string | null, GresGroup>>(
                [...map].map(([partition, nodes]) => {
                    return [partition, this._groupNodeByGres(nodes)];
                })
            );
            this.partitionGresMap = pmap;
        }
        return this.partitionGresMap;
    }
}

export const resourceService: ResourceService = ResourceService.getInstance();

