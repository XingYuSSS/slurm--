import * as vscode from 'vscode';


class ConfigService {
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

export let configService: ConfigService;

export function initConfigService(context: vscode.ExtensionContext) {
    configService = new ConfigService(context);
}
