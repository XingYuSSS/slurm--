import * as vscode from 'vscode';

import { executeCmd } from '../utils/utils';
import { Node } from '../models';
import { resourceTreeView, resourceViewDataProvider } from '../view/resourceView';
import { resourceService, configService } from '../services';
import { ListItem, NodeItem } from '../view/components';

let autoRefreshTimer: NodeJS.Timeout;

function extractNodes(nodeString: string, short_length: number, long_length: number): Node[] {
    let slices = [short_length, short_length, short_length, short_length, long_length, long_length, short_length, short_length];
    slices.reduce((arr, currentValue, currentIndex) => {
        if (currentIndex > 0) {
            slices[currentIndex] = slices[currentIndex - 1] + currentValue;
        }
        return slices[currentIndex - 1] + currentValue;
    }, 0);
    slices.unshift(0);

    let nodeList: Node[] = [];
    nodeString.split('\n').forEach((value) => {
        // NODELIST:15,Available:15,Memory:15,AllocMem:15,Gres:50,GresUsed:50,Partition:15,StateLong:15
        if (value.length === 0) { return; }

        let fields: string[] = slices.slice(1).reduce((arr: string[], v, i) => {
            arr.push(value.substring(v, slices[i]).trim());
            return arr;
        }, []);
        const node = new Node(fields[0], fields[1], fields[2], fields[3], fields[4], fields[5], fields[6], fields[7]);
        nodeList.push(node);
    });
    return nodeList;
}

async function refreshResources() {
    const short = 15;
    const long = 50;
    const [out, err] = await executeCmd(`sinfo --noheader --Node -O NODELIST:${short},Available:${short},Memory:${short},AllocMem:${short},Gres:${long},GresUsed:${long},Partition:${short},StateLong:${short}`);
    if (err) {
        vscode.window.showErrorMessage(err);
        return;
    }
    resourceService.updateNode(...extractNodes(out, short, long));
    resourceViewDataProvider.refresh();
}

async function autoRefreshRes() {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(() => {
        vscode.commands.executeCommand('slurm--.refreshResources');
    }, configService.resourceRefreshInterval_ms);
    vscode.commands.executeCommand('setContext', 'autoRefreshingRes', true);
}

async function unautoRefreshRes() {
    clearInterval(autoRefreshTimer);
    vscode.commands.executeCommand('setContext', 'autoRefreshingRes', false);
}

async function copyGres() {
    const selected = resourceTreeView.selection[0];
    if (selected instanceof ListItem){
        const gresString = (selected.title as string).replace(/\s*\(.*\)$/, '');
        vscode.env.clipboard.writeText(gresString);
    } else if (selected instanceof NodeItem){
        vscode.env.clipboard.writeText(selected.node.nodeid);
    }
}

export function initResourceCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.refreshResources', refreshResources));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.autoRefreshRes', autoRefreshRes));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.unautoRefreshRes', unautoRefreshRes));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.copyGres', copyGres));

    vscode.commands.executeCommand('setContext', 'autoRefreshingRes', false);
    vscode.commands.executeCommand('slurm--.refreshResources');
}
