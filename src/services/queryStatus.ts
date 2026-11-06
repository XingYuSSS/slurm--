import * as vscode from 'vscode';

type Query = 'squeue' | 'sinfo' | 'sacct';
const failures = new Map<Query, string>();
const successes = new Map<Query, string>();
let output: vscode.OutputChannel | undefined;
let updateView = () => {};

export function logCommand(message: string) {
    output?.appendLine(`[${new Date().toISOString()}] ${message}`);
}

export function reportQuery(query: Query, error?: string, background = false, notify = true) {
    const previous = failures.get(query);
    if (error) {
        failures.set(query, error);
        if (previous !== error) { logCommand(`${query}: ${error}`); }
        if (notify && (!background || previous !== error)) {
            const showLog = vscode.l10n.t('Show log');
            void vscode.window.showErrorMessage(`${query}: ${error}`, showLog).then(choice => {
                if (choice === showLog) { output?.show(true); }
            });
        }
    } else {
        failures.delete(query);
        successes.set(query, new Date().toLocaleTimeString());
    }
    updateView();
}

export function clearQueryFailure(query: Query) {
    failures.delete(query);
    updateView();
}

export function initQueryStatus(context: vscode.ExtensionContext, tasks: vscode.TreeView<any>, resources: vscode.TreeView<any>) {
    output = vscode.window.createOutputChannel('slurm--');
    context.subscriptions.push(output);
    const message = (query: Query) => {
        if (!failures.has(query)) { return ''; }
        const last = successes.get(query);
        return last
            ? vscode.l10n.t('{0}: refresh failed. Showing previous data (last updated {1}).', query, last)
            : vscode.l10n.t('{0}: no successful refresh yet.', query);
    };
    updateView = () => {
        tasks.message = [message('squeue'), failures.has('sacct') ? vscode.l10n.t('Completion information is unavailable (sacct).') : ''].filter(Boolean).join('\n') || undefined;
        resources.message = message('sinfo') || undefined;
    };
}
