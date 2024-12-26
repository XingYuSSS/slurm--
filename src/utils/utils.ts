import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import { promisify } from 'util';
import { ObjectEncodingOptions } from 'fs';
import { privateEncrypt } from 'crypto';

const execAsync = promisify(childProcess.exec);

export async function executeCmd(cmd: string): Promise<[string, string]> {
    const options: ObjectEncodingOptions & childProcess.ExecOptions = {
        encoding: 'utf8',
        timeout: 30000,
        maxBuffer: 1024 * 1024,
    };
    try {
        const { stdout, stderr } = await execAsync(cmd, options);
        return [stdout.trim(), stderr ? stderr.trim() : ''];
    } catch (error) {
        return ['', `${error}`];
    }
}

export function resignFn<T extends (...args: any[]) => number>(fn: T, sign: boolean): T {
    return ((...args: any[]) => {
        const result = fn(...args);
        return sign ? result : -result;
    }) as T;
}
