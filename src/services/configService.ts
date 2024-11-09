import * as vscode from 'vscode';


class ConfigService {
    private _taskRefreshInterval_ms!: number;
    private _resourceRefreshInterval_ms!: number;

    public get taskRefreshInterval_ms() : number {
        return this._taskRefreshInterval_ms;
    }
    public get resourceRefreshInterval_ms() : number {
        return this._resourceRefreshInterval_ms;
    }
    

    constructor(context: vscode.ExtensionContext) {
        this._taskRefreshInterval_ms = vscode.workspace.getConfiguration('slurm--.tasksPanel').get('refreshInterval(ms)')!;
        this._resourceRefreshInterval_ms = vscode.workspace.getConfiguration('slurm--.resourcesPanel').get('refreshInterval(ms)')!;
        const configurationChangeListener = vscode.workspace.onDidChangeConfiguration(this.onUpdateConfig, this);
        context.subscriptions.push(configurationChangeListener);
    }

    private onUpdateConfig(event: vscode.ConfigurationChangeEvent) {
        if (event.affectsConfiguration('slurm--.tasksPanel')) {
            this._taskRefreshInterval_ms = vscode.workspace.getConfiguration('slurm--.tasksPanel').get('refreshInterval(ms)')!;
        } else if (event.affectsConfiguration('slurm--.resourcesPanel')) {
            this._resourceRefreshInterval_ms = vscode.workspace.getConfiguration('slurm--.resourcesPanel').get('refreshInterval(ms)')!;
        }
    }
}

export let configService: ConfigService;

export function initConfigService(context: vscode.ExtensionContext) {
    configService = new ConfigService(context);
}
