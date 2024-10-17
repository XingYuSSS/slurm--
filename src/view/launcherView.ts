import * as vscode from 'vscode';

import { Node, Gres } from '../models/';
import { InfoItem, ListItem, ScriptItem } from './components';
import { scriptService } from '../services';

function getScripts(): ScriptItem[] | InfoItem[] {
    const scriptItems = scriptService.getScript().map(v=>new ScriptItem(v))
    return scriptItems.length === 0? [new InfoItem('Drop a script to here')] : scriptItems;
}

class FileDragAndDropController implements vscode.TreeDragAndDropController<ScriptItem> {
    readonly dropMimeTypes = ['text/uri-list', 'application/vnd.code.resource'];
    readonly dragMimeTypes = ['text/uri-list', 'application/vnd.code.resource'];


    
    async handleDrag(source: readonly ScriptItem[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken) {
        console.log('drag')
        console.log(dataTransfer)
        console.log(source)
    }

    async handleDrop(target: ScriptItem | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken) {
        console.log('drop')
        console.log(dataTransfer)
        console.log(target)
        const uriList = dataTransfer.get('text/uri-list');
        if (uriList) {
            const lines = (await uriList.asString()).split('\r\n');
            console.log(lines)
            const pathList = lines
                .filter(line => line.startsWith('file:///'))
                .map(line => line.slice(7));
            console.log(pathList)
            vscode.commands.executeCommand('slurm--.addScript', pathList);
        }
    }
}


export class LauncherViewDataProvider implements vscode.TreeDataProvider<ScriptItem | ListItem | InfoItem> {
    private static _instance: LauncherViewDataProvider | null = null;
    private constructor() { }

    static getInstance() {
        if (LauncherViewDataProvider._instance === null) {
            LauncherViewDataProvider._instance = new LauncherViewDataProvider();
        }
        return LauncherViewDataProvider._instance;
    }

    private _onDidChangeTreeData: vscode.EventEmitter<ScriptItem | undefined | null | void> = new vscode.EventEmitter<ScriptItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ScriptItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ScriptItem | ListItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ScriptItem | ListItem): Thenable<ListItem[] | ScriptItem[] | InfoItem[]> {
        if (!element) {
            return Promise.resolve(getScripts());
        }
        if (element instanceof ListItem) {
            return Promise.resolve(element.children as ScriptItem[]);
        }
        return Promise.resolve([]);
    }
}

export const launcherViewDataProvider = LauncherViewDataProvider.getInstance();
export let launcherTreeView: vscode.TreeView<ScriptItem | ListItem | InfoItem>;

export function initLauncherView(context: vscode.ExtensionContext) {
    launcherTreeView = vscode.window.createTreeView('slurm--_launcher_view', { treeDataProvider: launcherViewDataProvider, dragAndDropController: new FileDragAndDropController() });
    context.subscriptions.push(launcherTreeView);
}
