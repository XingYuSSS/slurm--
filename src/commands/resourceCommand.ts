import * as vscode from 'vscode';

import { executeCmd } from '../utils/utils';
import { Node } from '../models';
import { resourceTreeView, resourceViewDataProvider } from '../view/resourceView';
import { resourceService, configService } from '../services';
import { ListItem, NodeItem } from '../view/components';
import * as path from 'path';

let autoRefreshTimer: NodeJS.Timeout;

const fieldMap = new Map([
    ["NODELIST", 20],
    ["Available", 15],
    ["Memory", 15],
    ["AllocMem", 15],
    ["Gres", 50],
    ["GresUsed", 50],
    ["Partition", 20],
    ["StateLong", 20],
]);

let cachePath: string;

function extractNodes(nodeString: string): Node[] {
    let slices = Array.from(fieldMap.values());
    slices.reduce((arr, currentValue, currentIndex) => {
        if (currentIndex > 0) {
            slices[currentIndex] = slices[currentIndex - 1] + currentValue;
        }
        return slices[currentIndex - 1] + currentValue;
    }, 0);
    slices.unshift(0);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8');
    let nodeList: Node[] = [];
    nodeString.split('\n').forEach((value) => {
        // NODELIST:15,Available:15,Memory:15,AllocMem:15,Gres:50,GresUsed:50,Partition:15,StateLong:15
        if (value.length === 0) { return; }

        const encodedValue = encoder.encode(value);
        let fields: string[] = slices.slice(1).reduce((arr: string[], v, i) => {
            arr.push(decoder.decode(encodedValue.slice(slices[i], v)).trim());
            return arr;
        }, []);
        const node = new Node(fields[0], fields[1], fields[2], fields[3], fields[4], fields[5], fields[6], fields[7]);
        nodeList.push(node);
    });
    return nodeList;
}

async function refreshResources() {
    const query = Array.from(fieldMap.entries()).map(([key, value]) => `${key}:${value}`).join(',');
    const [out, err] = await executeCmd(`sinfo --noheader --Node -O ${query}`, cachePath, configService.resourceCacheTimeout);
    if (err) {
        vscode.window.showErrorMessage(err);
        return;
    }
    resourceService.updateNode(...extractNodes(out));
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

    cachePath = path.join(context.globalStorageUri.fsPath, 'resources_cache.json');
}
