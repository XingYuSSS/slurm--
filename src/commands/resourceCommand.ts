import * as vscode from 'vscode';

import { executeCmd } from '../utils/utils';
import { Node } from '../models';
import { resourceTreeView, resourceViewDataProvider } from '../view/resourceView';
import { resourceService, configService } from '../services';
import { ListItem, NodeItem } from '../view/components';

let autoRefreshTimer: NodeJS.Timeout;

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
    const [out, err] = await executeCmd(`sinfo --noheader --Node -O NODELIST:${short},Available:${short},Memory:${short},AllocMem:${short},Gres:${long},GresUsed:${long},Partition:${short}`);
    resourceService.updateNode(...extractNodes(out, short, long));
    resourceViewDataProvider.refresh();
}

export async function autoRefreshRes() {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(() => {
        vscode.commands.executeCommand('slurm--.refreshResources');
    }, configService.taskRefreshInterval_ms);
    vscode.commands.executeCommand('setContext', 'autoRefreshingRes', true);
}

export async function unautoRefreshRes() {
    clearInterval(autoRefreshTimer);
    vscode.commands.executeCommand('setContext', 'autoRefreshingRes', false);
}

export async function copyGres() {
    const selected = resourceTreeView.selection[0];
    if (selected instanceof ListItem){
        const gresString = (selected.title as string).replace(/\s*\(.*\)$/, '');
        vscode.env.clipboard.writeText(gresString);
    } else if (selected instanceof NodeItem){
        vscode.env.clipboard.writeText(selected.node.nodeid);
    }
}

export function initResCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.refreshResources', refreshResources));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.autoRefreshRes', autoRefreshRes));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.unautoRefreshRes', unautoRefreshRes));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.copyGres', copyGres));

    vscode.commands.executeCommand('setContext', 'autoRefreshingRes', false);
    vscode.commands.executeCommand('slurm--.refreshResources');
}
