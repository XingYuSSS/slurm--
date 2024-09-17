import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import { promisify } from 'util';
import { ObjectEncodingOptions } from 'fs';

const execAsync = promisify(childProcess.exec);

const options: ObjectEncodingOptions & childProcess.ExecOptions = {
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 1000 * 1024,
};

export async function runBash(cmd: string): Promise<[string, string]> {
    const { stdout, stderr } = await execAsync(cmd, options);
    return [stdout.trim(), stderr ? stderr.trim() : ''];
}


