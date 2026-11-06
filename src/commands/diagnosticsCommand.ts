import * as vscode from 'vscode';
import * as os from 'os';
import { configService, SlurmCommandName } from '../services/configService';
import { probeSlurmCommand } from '../services/commandAvailability';
import { getQueryDiagnostics, logCommand, showCommandLog } from '../services/queryStatus';
import { AsyncOnce } from '../utils/utils';

export function initDiagnosticsCommand(context: vscode.ExtensionContext) {
    const diagnose = AsyncOnce(async function diagnoseSlurmEnvironment() {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            title: vscode.l10n.t('Diagnosing Slurm environment...'),
        }, async () => {
            const commands: SlurmCommandName[] = ['squeue', 'sinfo', 'sacct', 'sbatch', 'scancel', 'srun'];
            const results = await Promise.all(commands.map(async command => {
                const binary = configService.getSlurmBinary(command);
                return { command, binary, ...await probeSlurmCommand(binary) };
            }));
            const lines = [
                vscode.l10n.t('Slurm environment diagnostics'),
                vscode.l10n.t('Extension: {0} {1}', context.extension.id, context.extension.packageJSON.version),
                vscode.l10n.t('Extension path: {0}', context.extension.extensionPath),
                vscode.l10n.t('VS Code: {0}', vscode.version),
                vscode.l10n.t('Extension host: {0} ({1}, {2})', os.hostname(), process.platform, process.arch),
                vscode.l10n.t('Remote environment: {0}', vscode.env.remoteName ?? vscode.l10n.t('Local')),
                '',
                vscode.l10n.t('Command availability (does not verify cluster connectivity):'),
            ];
            for (const result of results) {
                lines.push(`${result.command}: ${result.binary}`);
                lines.push('  ' + (result.available
                    ? vscode.l10n.t('Available: {0}', result.resolvedPaths.join(', '))
                    : vscode.l10n.t('Unavailable: {0}', result.error ?? '')));
            }
            lines.push('', vscode.l10n.t('Query status in this session:'));
            for (const status of getQueryDiagnostics()) {
                lines.push(`${status.query}: ` + vscode.l10n.t('Last successful refresh: {0}', status.lastSuccess ?? vscode.l10n.t('None')));
                if (status.error) { lines.push('  ' + status.error); }
            }
            logCommand(lines.join('\n'));
            showCommandLog();
        });
    });
    context.subscriptions.push(vscode.commands.registerCommand('slurm--.diagnoseEnvironment', diagnose));
}
