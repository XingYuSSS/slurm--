import * as vscode from 'vscode';

import { SbatchParam } from '../models';

export const SBATCH_PARAMS: readonly SbatchParam[] = [
    {
        short: 'J',
        long: 'job-name',
        description: `Specify a name for the job allocation.`,
        hasValue: true
    },
    {
        short: 'p',
        long: 'partition',
        description: `Request a specific partition for the resource allocation.`,
        hasValue: true
    },
    {
        short: 't',
        long: 'time',
        description: `Set a limit on the total run time of the job allocation.`,
        hasValue: true
    },
    {
        short: 'N',
        long: 'nodes',
        description: `Request that a minimum of minnodes nodes be allocated to this job. `,
        hasValue: true
    },
    {
        long: 'gres',
        description: `Specifies a comma-delimited list of generic consumable resources requested per node.`,
        hasValue: true
    },
    {
        short: 'w',
        long: 'nodelist',
        description: `Request a specific list of hosts.`,
        hasValue: true
    },
    {
        short: 'o',
        long: 'output',
        description: `Instruct Slurm to connect the batch script's standard output directly to the file name specified in the "filename pattern".`,
        hasValue: true
    },
    {
        short: 'e',
        long: 'error',
        description: `Instruct Slurm to connect the batch script's standard error directly to the file name specified in the "filename pattern".`,
        hasValue: true
    }
] as const;


export const SBATCH_SHORT_TO_LONG: Record<string, string> = {};
for (const param of SBATCH_PARAMS) {
    if (param.short) {
        SBATCH_SHORT_TO_LONG[param.short] = param.long;
    }
}
