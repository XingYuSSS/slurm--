import * as vscode from 'vscode';


class ConfigService {
    private _taskRefreshInterval_ms!: number;
    private _resourceRefreshInterval_ms!: number;
    private _option_user!: string;

    public get taskRefreshInterval_ms(): number {
        return this._taskRefreshInterval_ms;
    }
    public get resourceRefreshInterval_ms(): number {
        return this._resourceRefreshInterval_ms;
    }
    public get option_user(): string {
        return this._option_user;
    }


    constructor(context: vscode.ExtensionContext) {
        this._taskRefreshInterval_ms = vscode.workspace.getConfiguration('slurm--.tasksPanel').get('refreshInterval(ms)')!;
        this._resourceRefreshInterval_ms = vscode.workspace.getConfiguration('slurm--.resourcesPanel').get('refreshInterval(ms)')!;
        this._option_user = vscode.workspace.getConfiguration('slurm--.commands').get('user')!;
        const configurationChangeListener = vscode.workspace.onDidChangeConfiguration(this.onUpdateConfig, this);
        context.subscriptions.push(configurationChangeListener);
    }

    private onUpdateConfig(event: vscode.ConfigurationChangeEvent) {
        if (event.affectsConfiguration('slurm--.tasksPanel')) {
            this._taskRefreshInterval_ms = vscode.workspace.getConfiguration('slurm--.tasksPanel').get('refreshInterval(ms)')!;
        } else if (event.affectsConfiguration('slurm--.resourcesPanel')) {
            this._resourceRefreshInterval_ms = vscode.workspace.getConfiguration('slurm--.resourcesPanel').get('refreshInterval(ms)')!;
        } else if (event.affectsConfiguration('slurm--.commands')) {
            this._option_user = vscode.workspace.getConfiguration('slurm--.commands').get('user')!;
        }
    }
}

export let configService: ConfigService;

export function initConfigService(context: vscode.ExtensionContext) {
    configService = new ConfigService(context);
}
