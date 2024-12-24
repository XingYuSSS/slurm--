import * as vscode from 'vscode';

export enum TaskSortKeys {
    NAME = 'name',
    ID = 'id',
}

export enum GresSortKeys {
    NAME = 'name',
    AVAIL = 'availability',
}

class ConfigService {
    public get taskRefreshInterval_ms(): number {
        return vscode.workspace.getConfiguration('slurm--.tasksPanel').get('refreshInterval(ms)') ?? 3000;
    }
    public get resourceRefreshInterval_ms(): number {
        return vscode.workspace.getConfiguration('slurm--.resourcesPanel').get('refreshInterval(ms)') ?? 3000;
    }
    public get optionUser(): string {
        return vscode.workspace.getConfiguration('slurm--.commands').get('user') ?? '--me';
    }

    #taskSortKey: string;
    public get taskSortKey(): TaskSortKeys {
        if (!Object.values(TaskSortKeys).includes(this.#taskSortKey as TaskSortKeys)) {
            vscode.window.showWarningMessage(vscode.l10n.t('Error task sort key: {0}', this.#taskSortKey));
            return TaskSortKeys.ID;
        }
        return this.#taskSortKey as TaskSortKeys;
    }
    public set taskSortKey(key: TaskSortKeys) {
        vscode.workspace.getConfiguration('slurm--.tasksPanel').update('sortBy', key);
        vscode.commands.executeCommand('setContext', 'taskSortKey', key);
        this.#taskSortKey = key;
    }

    #gresSortKey: string;
    public get gresSortKey(): GresSortKeys {
        if (!Object.values(GresSortKeys).includes(this.#gresSortKey as GresSortKeys)) {
            vscode.window.showWarningMessage(vscode.l10n.t('Error resource sort key: {0}', this.#gresSortKey));
            return GresSortKeys.NAME;
        }
        return this.#gresSortKey as GresSortKeys;
    }
    public set gresSortKey(key: GresSortKeys) {
        vscode.workspace.getConfiguration('slurm--.resourcesPanel').update('sortBy', key);
        vscode.commands.executeCommand('setContext', 'gresSortKey', key);
        this.#gresSortKey = key;
    }


    constructor(context: vscode.ExtensionContext) {
        const configurationChangeListener = vscode.workspace.onDidChangeConfiguration(this.onUpdateConfig, this);
        context.subscriptions.push(configurationChangeListener);

        this.#gresSortKey = vscode.workspace.getConfiguration('slurm--.resourcesPanel').get('sortBy') as string ?? 'name';
        this.#taskSortKey = vscode.workspace.getConfiguration('slurm--.tasksPanel').get('sortBy') as string ?? 'id';
        this.gresSortKey = this.gresSortKey;
        this.taskSortKey = this.taskSortKey;
    }

    private onUpdateConfig(event: vscode.ConfigurationChangeEvent) {
        this.#gresSortKey = vscode.workspace.getConfiguration('slurm--.resourcesPanel').get('sortBy') as string ?? 'name';
        this.#taskSortKey = vscode.workspace.getConfiguration('slurm--.tasksPanel').get('sortBy') as string ?? 'id';
    }
}

export let configService: ConfigService;

export function initConfigService(context: vscode.ExtensionContext) {
    configService = new ConfigService(context);
}
