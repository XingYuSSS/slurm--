import * as vscode from 'vscode';

import { runBash } from '../utils/utils';
import { Node } from '../models';
import { resourceService } from '../services/resouceService';

function extractNodes(nodeString: string, short_length: number, long_length: number): Node[] {
    let slices = [short_length, short_length, short_length, short_length, long_length, long_length, short_length];
    slices.reduce((arr, currentValue, currentIndex) => {
        if (currentIndex > 0) {
            slices[currentIndex] = slices[currentIndex - 1] + currentValue;
        }
        return slices[currentIndex - 1] + currentValue;
    }, 0);
    slices.unshift(0);

    let nodeList: Node[] = [];
    nodeString.split('\n').forEach((value) => {
        // JobID,Name:255,Username:20,State:20,NodeList,Gres:50,TimeLimit,TimeUsed,Command:255,STDOUT:255,STDERR:255,Reason:100
        if (value.length === 0) { return; }

        let fields: string[] = slices.slice(1).reduce((arr: string[], v, i) => {
            arr.push(value.substring(v, slices[i]).trim());
            return arr;
        }, []);
        const node = new Node(fields[0], fields[1], fields[2], fields[3], fields[4], fields[5], fields[6]);
        nodeList.push(node);
    });
    return nodeList;
}

export async function refreshResources() {
    const short = 15;
    const long = 50;
    const [out, err] = await runBash(`sinfo --noheader -O NODELIST:${short},Available:${short},Memory:${short},AllocMem:${short},Gres:${long},GresUsed:${long},Partition:${short}`);
    resourceService.updateNode(...extractNodes(out, short, long));
    console.log(resourceService.getNode())
}

export function initResCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.refreshResources', refreshResources));
}
