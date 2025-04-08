import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(childProcess.exec);

export async function executeCmd(cmd: string, cachePath?: string, cacheTimeout?: number): Promise<[string, string]> {
    if (cacheTimeout !== 0 && cachePath && fs.existsSync(cachePath)) {
        const jsonData = fs.readFileSync(cachePath, 'utf8');
        const saveObject = JSON.parse(jsonData);
        const now = Date.now();
        if (now - saveObject.time < (cacheTimeout ?? 1000) && cmd === saveObject.cmd) {
            return [saveObject.out.trim(), saveObject.err ? saveObject.err.trim() : ''];
        }
    }
    const options: fs.ObjectEncodingOptions & childProcess.ExecOptions = {
        encoding: 'utf8',
        timeout: 30000,
        maxBuffer: 1024 * 1024,
    };
    try {
        const { stdout, stderr } = await execAsync(cmd, options);
        if (cacheTimeout !== 0 && cachePath) {
            const saveObject = {
                'time': Date.now(),
                'cmd': cmd,
                'out': stdout,
                'err': stderr,
            };
            const jsonData = JSON.stringify(saveObject);
            fs.writeFileSync(cachePath, jsonData, 'utf8');
        }
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


const asyncOnceStates: { [key: string]: Promise<any> | null } = {};

export function AsyncOnce<T extends (...args: any[]) => Promise<any>>(fn: T, key?: string): T {
    return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
        if (key === undefined) { key = fn.name; }
        
        if (!asyncOnceStates[key]) {
            asyncOnceStates[key] = (async () => {
                try {
                    return await fn.apply(null, args);
                } finally {
                    asyncOnceStates[key] = null;
                }
            })();
        }

        return asyncOnceStates[key] as Awaited<ReturnType<T>>;
    }) as unknown as T;
}
