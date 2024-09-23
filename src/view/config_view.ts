import * as vscode from 'vscode';

import * as taskModel from '../model/tasks_model';

export class ConfigViewItem extends vscode.TreeItem {
    constructor(label: string | vscode.TreeItemLabel, description?: string | boolean, tooltip?: string | vscode.MarkdownString, public readonly children?: vscode.TreeItem[]) {
        super(label, children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
        this.description = description;
        this.tooltip = tooltip;
        
    }
}

const configTree = [
    new ConfigViewItem('Common', undefined, undefined, [
        new ConfigViewItem('auto refresh')
    ]),
];

export class ConfigViewDataProvider implements vscode.TreeDataProvider<ConfigViewItem> {
    private static _instance: ConfigViewDataProvider | null = null;
    private constructor() { }

    static getInstance() {
        if (ConfigViewDataProvider._instance === null) {
            ConfigViewDataProvider._instance = new ConfigViewDataProvider();
        }
        return ConfigViewDataProvider._instance;
    }

    private _onDidChangeTreeData: vscode.EventEmitter<ConfigViewItem | undefined | null | void> = new vscode.EventEmitter<ConfigViewItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ConfigViewItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ConfigViewItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ConfigViewItem): Thenable<ConfigViewItem[]> {
        if (!element) {
            return Promise.resolve(configTree);
        }
        if (element instanceof ConfigViewItem) {
            return Promise.resolve(element.children as vscode.TreeItem[]);
        }
        return Promise.resolve([]);
    }

}

export let configViewDataProvider: ConfigViewDataProvider;
export let configTreeView: vscode.TreeView<ConfigViewItem>;

export function initConfigView(context: vscode.ExtensionContext) {
    configViewDataProvider = ConfigViewDataProvider.getInstance();
    configTreeView = vscode.window.createTreeView('slurm--_config_view', { treeDataProvider: configViewDataProvider });
    configTreeView.onDidChangeCheckboxState((e) => {
        e.items.forEach(v => {
            if (v[0].label === 'auto refresh') {
                v[1] === vscode.TreeItemCheckboxState.Unchecked
                    ? vscode.commands.executeCommand('slurm--.autoRefreshTask')
                    : vscode.commands.executeCommand('slurm--.unautoRefreshTask');
            }
        });
    });
    context.subscriptions.push(configTreeView);
}

