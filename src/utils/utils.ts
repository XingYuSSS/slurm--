import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import FastGlob from 'fast-glob';

export async function executeCmd(
  cmd: string,
  cachePath?: string,
  cacheTimeout?: number
): Promise<[string, string]> {
    if (cacheTimeout !== 0 && cachePath && fs.existsSync(cachePath)) {
        try {
            const jsonData = fs.readFileSync(cachePath, 'utf8');
            const saveObject = JSON.parse(jsonData);
            const now = Date.now();
            if (now - saveObject.time < (cacheTimeout ?? 1000) && cmd === saveObject.cmd) {
                return [saveObject.out.trim(), saveObject.err ? saveObject.err.trim() : ''];
            }
        } catch (err) {}
    }

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';

    const child = childProcess.spawn(cmd, [], {
      shell: true,
      timeout: 30000,
    });

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', ( data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      resolve(['', `${error}`]);
    });

    child.on('close', (code, signal) => {
      if (cacheTimeout !== 0 && cachePath) {
        const saveObject = {
          time: Date.now(),
          cmd,
          out: stdout,
          err: stderr,
        };
        try {
          fs.writeFileSync(cachePath, JSON.stringify(saveObject), 'utf8');
        } catch (writeErr) {}
      }
      resolve([stdout.trim(), stderr.trim()]);
    });
  });
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


export function convertKeysToCamelCase(obj: Record<string, any>): Record<string, any> {
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/(_\w)/g, (match) => match[1].toUpperCase());
    acc[camelKey] = obj[key];
    return acc;
  }, {} as Record<string, any>);
}


export async function findFiles(folderPath: string, extensions: string[], ignore?: string[]): Promise<vscode.Uri[]> {
  const pattern = `**/*.{${extensions.join(',')}}`;
  
  try {
    const files = await FastGlob(pattern, {
      cwd: folderPath,
      ignore: ignore,
      onlyFiles: true,
      absolute: true,
      concurrency: 10
    });
    
    return files.map(filePath => vscode.Uri.file(filePath));
  } catch (error) {
    vscode.window.showErrorMessage(`Fast-glob search failed: ${error}`);
    return [];
  }
}

export async function withDelayedProgress<T>(
    options: {
        delayMs: number,
        location: vscode.ProgressLocation;
        title?: string;
        cancellable?: boolean;
    },
    work: () => Promise<T>,
): Promise<T> {
    const workPromise = work();

    const showProgress = await Promise.race([
        workPromise.then(() => false),
        new Promise<boolean>(resolve => setTimeout(() => resolve(true), options.delayMs))
    ]);

    if (!showProgress) {
        return workPromise;
    }

    return vscode.window.withProgress(
        {
            location: options.location,
            title: options?.title,
            cancellable: options?.cancellable ?? false
        },
        () => workPromise
    );
}
