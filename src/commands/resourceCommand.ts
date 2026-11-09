import * as vscode from 'vscode';

import { createRefreshHandler, executeCmd } from '../utils/utils';
import { ensureSlurmCommand } from '../services/commandAvailability';
import { reportQuery } from '../services/queryStatus';
import { Node } from '../models';
import { resourceTreeView, resourceViewDataProvider } from '../view/resourceView';
import { resourceService, configService } from '../services';
import { GresItem, NodeItem } from '../view/components';
import * as path from 'path';

let autoRefreshTimer: NodeJS.Timeout;

const fieldMap = new Map([
    ["NODELIST", 20],
    ["Available", 15],
    ["Memory", 15],
    ["AllocMem", 15],
    ["Gres", 200],
    ["GresUsed", 200],
    ["Partition", 20],
    ["StateLong", 20],
    ["CPUsState", 20],
]);
const fieldNames = Array.from(fieldMap.keys());

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
        // NODELIST:20,Available:15,Memory:15,AllocMem:15,Gres:50,GresUsed:50,Partition:20,StateLong:20,CPUsState:20
        if (value.length === 0) { return; }

        const encodedValue = encoder.encode(value);
        let fields: Record<string, string> = slices.slice(1).reduce((rec: Record<string, string>, v, i) => {
            rec[fieldNames[i]] = decoder.decode(encodedValue.slice(slices[i], v)).trim();
            return rec;
        }, {});
        const node = new Node({
            nodeid: fields['NODELIST'],
            available: fields['Available'],
            memory: fields['Memory'],
            allocMemory: fields['AllocMem'],
            gres: fields['Gres'],
            usedGres: fields['GresUsed'],
            partition: fields['Partition'],
            state: fields['StateLong'],
            cpuState: fields['CPUsState'],
        });
        nodeList.push(node);
    });
    return nodeList;
}

async function refreshResources(background = false) {
    if (!await ensureSlurmCommand('sinfo', background)) {
        reportQuery('sinfo', vscode.l10n.t('Command unavailable.'), background, false);
        await unautoRefreshRes();
        return;
    }
    const argsObj = configService.sinfoExtraArgs;
    const showAll = configService.sinfoShowAllClusters;
    if ('-M' in argsObj && showAll) {
        reportQuery('sinfo', 'Do not add the -M option when "Sinfo Show All Clusters" is enabled.', background);
        return;
    }

    const args = Object.entries(argsObj)
        .map(([key, value]) => `${key} ${value}`)
        .join(' ') + (showAll ? ' -M all' : '');
    
    const query = Array.from(fieldMap.entries()).map(([key, value]) => `${key}:${value}`).join(',');
    const { stdout: out, error: err } = await executeCmd(`${configService.getSlurmCommand('sinfo')} --noheader --Node ${args.trim()} -O ${query}`, cachePath, configService.resourceCacheTimeout);
    if (err) {
        reportQuery('sinfo', err, background);
        return;
    }

    resourceService.updateNode(...extractNodes(out));
    reportQuery('sinfo');
    resourceViewDataProvider.refresh();
}

async function autoRefreshRes() {
    clearInterval(autoRefreshTimer);
    if (!await ensureSlurmCommand('sinfo')) {
        await unautoRefreshRes();
        return;
    }
    autoRefreshTimer = setInterval(() => {
        vscode.commands.executeCommand('slurm--.refreshResources', true);
    }, configService.resourceRefreshInterval_ms);
    vscode.commands.executeCommand('setContext', 'autoRefreshingRes', true);
}

async function unautoRefreshRes() {
    clearInterval(autoRefreshTimer);
    vscode.commands.executeCommand('setContext', 'autoRefreshingRes', false);
}

function getTreeItemLabel(item: vscode.TreeItem): string {
    const label = item.label;
    return typeof label === 'string' ? label : label?.label ?? '';
}

async function copyGres(item?: GresItem | NodeItem) {
    const selected = item ?? resourceTreeView.selection[0];
    if (selected instanceof GresItem) {
        const gresId = selected.gres?.toIdString();
        const gresString = gresId && gresId.length > 0 ? gresId : getTreeItemLabel(selected).replace(/\s*\(.*\)$/, '');
        vscode.env.clipboard.writeText(gresString);
    } else if (selected instanceof NodeItem) {
        vscode.env.clipboard.writeText(selected.node.nodeid);
    }
}

export function initResourceCmd(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.refreshResources', createRefreshHandler(refreshResources)));
    context.subscriptions.push({ dispose: () => clearInterval(autoRefreshTimer) });
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.autoRefreshRes', autoRefreshRes));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.unautoRefreshRes', unautoRefreshRes));
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.copyGres', copyGres));

    vscode.commands.executeCommand('setContext', 'autoRefreshingRes', false);

    cachePath = path.join(context.globalStorageUri.fsPath, 'resources_cache.json');
}
