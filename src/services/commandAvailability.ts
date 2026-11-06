import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { configService, SlurmCommandName } from './configService';

const warned = new Set<string>();

export interface CommandAvailability {
    available: boolean;
    resolvedPaths: string[];
    error?: string;
}

export function probeSlurmCommand(binary: string): Promise<CommandAvailability> {
    // Windows queries use cmd.exe, so do not probe a separate Unix shell's PATH.
    return new Promise(resolve => {
        const executable = process.platform === 'win32' ? 'where.exe' : '/bin/sh';
        const args = process.platform === 'win32' ? [binary]
            : ['-c', 'p=$(command -v "$1") && test -f "$p" && test -x "$p" && printf "%s\\n" "$p"', 'slurm--', binary];
        execFile(executable, args, { timeout: 5000, windowsHide: true }, (error, stdout, stderr) => resolve({
            available: !error,
            resolvedPaths: error ? [] : stdout.trim().split(/\r?\n/).filter(Boolean),
            error: error ? stderr.trim() || error.message : undefined,
        }));
    });
}

export async function ensureSlurmCommand(command: SlurmCommandName, background = false): Promise<boolean> {
    const binary = configService.getSlurmBinary(command);
    const { available } = await probeSlurmCommand(binary);
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
