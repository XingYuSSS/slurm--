import * as vscode from 'vscode';

export enum TaskSortKeys {
    NAME = 'name',
    ID = 'id',
}

export enum GresSortKeys {
    NAME = 'name',
    AVAIL = 'availability',
}

export enum SortDirection {
    ASCEND = 'ascending',
    DESCEND = 'descending'
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
        return this.#taskSortKey as TaskSortKeys;
    }
    public set taskSortKey(key: TaskSortKeys) {
        vscode.workspace.getConfiguration('slurm--.tasksPanel').update('sortBy', key);
        vscode.commands.executeCommand('setContext', 'taskSortKey', key);
        this.#taskSortKey = key;
    }

    #taskSortDirection: string;
    public get taskSortDirection(): SortDirection {
        return this.#taskSortDirection as SortDirection;
    }
    public set taskSortDirection(key: SortDirection) {
        vscode.workspace.getConfiguration('slurm--.tasksPanel').update('sortDirection', key);
        vscode.commands.executeCommand('setContext', 'taskSortDirection', key);
        this.#taskSortDirection = key;
    }
    public get taskSortAscending(): boolean {
        return (this.#taskSortDirection as SortDirection) === SortDirection.ASCEND;
    }

    #gresSortKey: string;
    public get gresSortKey(): GresSortKeys {
        return this.#gresSortKey as GresSortKeys;
    }
    public set gresSortKey(key: GresSortKeys) {
        vscode.workspace.getConfiguration('slurm--.resourcesPanel').update('sortBy', key);
        vscode.commands.executeCommand('setContext', 'gresSortKey', key);
        this.#gresSortKey = key;
    }

    #gresSortDirection: string;
    public get gresSortDirection(): SortDirection {
        return this.#gresSortDirection as SortDirection;
    }
    public set gresSortDirection(key: SortDirection) {
        vscode.workspace.getConfiguration('slurm--.resourcesPanel').update('sortDirection', key);
        vscode.commands.executeCommand('setContext', 'gresSortDirection', key);
        this.#gresSortDirection = key;
    }
    public get gresSortAscending(): boolean {
        return (this.#gresSortDirection as SortDirection) === SortDirection.ASCEND;
    }


    constructor(context: vscode.ExtensionContext) {
        const configurationChangeListener = vscode.workspace.onDidChangeConfiguration(this.onUpdateConfig, this);
        context.subscriptions.push(configurationChangeListener);

        this.#gresSortKey = vscode.workspace.getConfiguration('slurm--.resourcesPanel').get('sortBy') as string ?? 'name';
        this.#taskSortKey = vscode.workspace.getConfiguration('slurm--.tasksPanel').get('sortBy') as string ?? 'id';
        this.#gresSortDirection = vscode.workspace.getConfiguration('slurm--.resourcesPanel').get('sortDirection') as string ?? 'ascending';
        this.#taskSortDirection = vscode.workspace.getConfiguration('slurm--.tasksPanel').get('sortDirection') as string ?? 'ascending';

        this.gresSortKey = this.gresSortKey;
        this.taskSortKey = this.taskSortKey;
        this.gresSortDirection = this.gresSortDirection;
        this.taskSortDirection = this.taskSortDirection;
    }

    private onUpdateConfig(event: vscode.ConfigurationChangeEvent) {
        this.#gresSortKey = vscode.workspace.getConfiguration('slurm--.resourcesPanel').get('sortBy') as string ?? 'name';
        this.#taskSortKey = vscode.workspace.getConfiguration('slurm--.tasksPanel').get('sortBy') as string ?? 'id';
        this.#gresSortDirection = vscode.workspace.getConfiguration('slurm--.resourcesPanel').get('sortDirection') as string ?? 'ascending';
        this.#taskSortDirection = vscode.workspace.getConfiguration('slurm--.tasksPanel').get('sortDirection') as string ?? 'ascending';
    }
}

export let configService: ConfigService;

export function initConfigService(context: vscode.ExtensionContext) {
    configService = new ConfigService(context);
}
