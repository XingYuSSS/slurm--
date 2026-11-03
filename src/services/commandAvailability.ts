import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { configService, SlurmCommandName } from './configService';

const warned = new Set<string>();

export async function ensureSlurmCommand(command: SlurmCommandName, background = false): Promise<boolean> {
    const binary = configService.getSlurmBinary(command);
    // Probe in the same non-interactive shell environment used for queries.
    const available = await new Promise<boolean>(resolve => {
        execFile('/bin/sh', ['-c', 'p=$(command -v "$1") && test -f "$p" && test -x "$p"', 'slurm--', binary],
            { timeout: 5000 }, error => resolve(!error));
    });
    const key = `${command}:${binary}`;
    if (available) {
        warned.delete(key);
        return true;
    }
    if (!background || (configService.hasCustomSlurmBinary(command) && !warned.has(key))) {
        warned.add(key);
        const message = configService.hasCustomSlurmBinary(command)
            ? vscode.l10n.t('Configured Slurm command "{0}" is not available. Check its path and executable permissions in Slurm command binaries.', binary)
            : vscode.l10n.t('Slurm command "{0}" is not available in the extension environment. Check your Slurm installation, PATH, or command binaries settings.', binary);
        const openSettings = vscode.l10n.t('Open settings');
        void vscode.window.showWarningMessage(message, openSettings).then(choice => {
            if (choice === openSettings) {
                void vscode.commands.executeCommand('workbench.action.openSettings', 'slurm--.commands.binaries');
            }
        });
    }
    return false;
}
