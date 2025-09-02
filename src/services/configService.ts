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

export const TaskInfoConfigKeys = ["id", "nodelist", "GRES", "command", "stdout", "stderr", "submit", "start", "finish"];

export type TaskInfoConfig = {
    [key in typeof TaskInfoConfigKeys[number]]: boolean;
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
    public get sinfoExtraArgs(): object {
        return vscode.workspace.getConfiguration('slurm--.commands').get('sinfoExtraArgs') ?? {};
    }
    public get sinfoShowAllClusters(): boolean {
        return vscode.workspace.getConfiguration('slurm--.commands').get('sinfoShowAllClusters') ?? false;
    }
    public get taskCacheTimeout(): number {
        return vscode.workspace.getConfiguration('slurm--.tasksPanel').get('cacheTimeout') ?? 1000;
    }
    public get resourceCacheTimeout(): number {
        return vscode.workspace.getConfiguration('slurm--.resourcesPanel').get('cacheTimeout') ?? 1000;
    }

    #taskSortKey!: string;
    public get taskSortKey(): TaskSortKeys {
        return this.#taskSortKey as TaskSortKeys;
    }
    public set taskSortKey(key: TaskSortKeys) {
        vscode.workspace.getConfiguration('slurm--.tasksPanel').update('sortBy', key);
        vscode.commands.executeCommand('setContext', 'taskSortKey', key);
        this.#taskSortKey = key;
    }

    #taskSortDirection!: string;
    public get taskSortDirection(): SortDirection {
        return this.#taskSortDirection as SortDirection;
    }
    public set taskSortDirection(direction: SortDirection) {
        vscode.workspace.getConfiguration('slurm--.tasksPanel').update('sortDirection', direction);
        vscode.commands.executeCommand('setContext', 'taskSortDirection', direction);
        this.#taskSortDirection = direction;
    }
    public get taskSortAscending(): boolean {
        return (this.#taskSortDirection as SortDirection) === SortDirection.ASCEND;
    }

    #taskShowShortcutKey!: boolean;
    public get taskShowShortcutKey(): boolean {
        return this.#taskShowShortcutKey;
    }
    public set taskShowShortcutKey(show: boolean) {
        vscode.workspace.getConfiguration('slurm--.tasksPanel').update('showShortcutKey', show);
        vscode.commands.executeCommand('setContext', 'taskShowShortcutKey', show);
        this.#taskShowShortcutKey = show;
    }

    #taskShowFilenameOnly!: boolean;
    public get taskShowFilenameOnly(): boolean {
        return this.#taskShowFilenameOnly;
    }
    public set taskShowFilenameOnly(only: boolean) {
        vscode.workspace.getConfiguration('slurm--.tasksPanel').update('showFilenameOnly', only);
        vscode.commands.executeCommand('setContext', 'showFilenameOnly', only);
        this.#taskShowFilenameOnly = only;
    }

    #taskDisplayInfo!: TaskInfoConfig;
    public get taskDisplayInfo(): TaskInfoConfig {
        return this.#taskDisplayInfo;
    }
    public set taskDisplayInfo(info: TaskInfoConfig) {
        vscode.workspace.getConfiguration('slurm--.tasksPanel').update('displayInformation', info);
        this.#taskDisplayInfo = info;
    }

    #gresSortKey!: string;
    public get gresSortKey(): GresSortKeys {
        return this.#gresSortKey as GresSortKeys;
    }
    public set gresSortKey(key: GresSortKeys) {
        vscode.workspace.getConfiguration('slurm--.resourcesPanel').update('sortBy', key);
        vscode.commands.executeCommand('setContext', 'gresSortKey', key);
        this.#gresSortKey = key;
    }

    #gresSortDirection!: string;
    public get gresSortDirection(): SortDirection {
        return this.#gresSortDirection as SortDirection;
    }
    public set gresSortDirection(direction: SortDirection) {
        vscode.workspace.getConfiguration('slurm--.resourcesPanel').update('sortDirection', direction);
        vscode.commands.executeCommand('setContext', 'gresSortDirection', direction);
        this.#gresSortDirection = direction;
    }
    public get gresSortAscending(): boolean {
        return (this.#gresSortDirection as SortDirection) === SortDirection.ASCEND;
    }


    constructor(context: vscode.ExtensionContext) {
        const configurationChangeListener = vscode.workspace.onDidChangeConfiguration(this.onUpdateConfig, this);
        context.subscriptions.push(configurationChangeListener);

        this.onUpdateConfig();
    }

    private onUpdateConfig(event?: vscode.ConfigurationChangeEvent) {
        this.#gresSortKey = vscode.workspace.getConfiguration('slurm--.resourcesPanel').get('sortBy') as string ?? 'name';
        this.#taskSortKey = vscode.workspace.getConfiguration('slurm--.tasksPanel').get('sortBy') as string ?? 'id';
        this.#gresSortDirection = vscode.workspace.getConfiguration('slurm--.resourcesPanel').get('sortDirection') as string ?? 'ascending';
        this.#taskSortDirection = vscode.workspace.getConfiguration('slurm--.tasksPanel').get('sortDirection') as string ?? 'ascending';
        this.#taskShowShortcutKey = vscode.workspace.getConfiguration('slurm--.tasksPanel').get('showShortcutKey') as boolean ?? true;
        this.#taskShowFilenameOnly = vscode.workspace.getConfiguration('slurm--.tasksPanel').get('showFilenameOnly') as boolean ?? true;
        this.#taskDisplayInfo = vscode.workspace.getConfiguration('slurm--.tasksPanel').get('displayInformation') as TaskInfoConfig;
        
        vscode.commands.executeCommand('setContext', 'taskSortKey', this.#taskSortKey);
        vscode.commands.executeCommand('setContext', 'taskSortDirection', this.#taskSortDirection);
        vscode.commands.executeCommand('setContext', 'taskShowShortcutKey', this.#taskShowShortcutKey);
        vscode.commands.executeCommand('setContext', 'showFilenameOnly', this.#taskShowFilenameOnly);
        vscode.commands.executeCommand('setContext', 'gresSortDirection', this.#gresSortDirection);
        vscode.commands.executeCommand('setContext', 'gresSortKey', this.#gresSortKey);
    }
}

export let configService: ConfigService;

export function initConfigService(context: vscode.ExtensionContext) {
    configService = new ConfigService(context);
}
