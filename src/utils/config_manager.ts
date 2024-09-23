import * as vscode from 'vscode';


class ConfigManager {
    private _taskRefreshInterval_ms: number;
    public get taskRefreshInterval_ms() : number {
        return this._taskRefreshInterval_ms;
    }
    

    constructor(context: vscode.ExtensionContext) {
        this._taskRefreshInterval_ms = vscode.workspace.getConfiguration('slurm--.autoRefresh').get('interval(ms)')!;
        const configurationChangeListener = vscode.workspace.onDidChangeConfiguration(this.onUpdateConfig, this);
        context.subscriptions.push(configurationChangeListener);
    }

    private onUpdateConfig(event: vscode.ConfigurationChangeEvent) {
        if (event.affectsConfiguration('slurm--.autoRefresh')) {
            this._taskRefreshInterval_ms = vscode.workspace.getConfiguration('slurm--.autoRefresh').get('interval(ms)')!;
            // console.log(this.taskRefreshInterval_ms)
        }
    }
}

export let configManager: ConfigManager;

export function initConfigManager(context: vscode.ExtensionContext) {
    configManager = new ConfigManager(context);
}
