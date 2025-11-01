import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { Script } from '../models';

export class ScriptService {
    private storagePath;
    private scriptList!: Script[];

    public constructor(storagePath: string) {
        this.storagePath = storagePath;
        const dir = path.dirname(this.storagePath);
        fs.mkdirSync(dir, { recursive: true });
        this.loadScript();
    }

    public loadScript() {
        if (fs.existsSync(this.storagePath)) {
            const jsonData = fs.readFileSync(this.storagePath, 'utf8');
            this.scriptList = [...JSON.parse(jsonData)];
            this.scriptList = this.scriptList.map(v => Script.fromObject(v));
        } else {
            this.scriptList = [];
        }
    }

    public saveScript() {
        const jsonData = JSON.stringify(this.scriptList, (k, v) => {
            return v;
        });

        const tempPath = this.storagePath + '.tmp';
        fs.writeFileSync(tempPath, jsonData, 'utf8');

        fs.renameSync(tempPath, this.storagePath);
    }

    public addScript(...scripts: Script[]) {
        this.scriptList.push(...scripts);
        this.saveScript();
    }

    public deleteScript(...scripts: Script[]): void {
        this.scriptList = this.scriptList.filter(v => !scripts.includes(v));
        this.saveScript();
    }

    public getScript(): Script[] {
        return this.scriptList;
    }
}

export let localScriptService: ScriptService | null = null;
export let globalScriptService: ScriptService;

export function initScriptService(context: vscode.ExtensionContext) {
    if (context.storageUri) {
        let localPath = path.join(context.storageUri.fsPath, 'scripts.json');
        localScriptService = new ScriptService(localPath);
    }

    let globalPath = path.join(context.globalStorageUri.fsPath, 'scripts.json');
    globalScriptService = new ScriptService(globalPath);
}
