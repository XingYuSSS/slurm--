import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { Script } from '../models';

export class ScriptService {
    private storagePath;
    private scriptList!: Script[];

    private static _instance: ScriptService | null = null;
    private constructor(context: vscode.ExtensionContext) {
        this.storagePath = path.join(context.storageUri?.fsPath ?? context.globalStorageUri.fsPath, 'scripts.json');
        const dir = path.dirname(this.storagePath);
        fs.mkdirSync(dir, { recursive: true });
        this.loadScript();
    }

    static getInstance(context?: vscode.ExtensionContext): ScriptService {
        if (ScriptService._instance === null) {
            if (context === undefined) {
                throw new Error(`init ${this.name} failed.`);
            }
            ScriptService._instance = new ScriptService(context);
        }
        return ScriptService._instance;
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
        fs.writeFileSync(this.storagePath, jsonData, 'utf8');
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

export let scriptService: ScriptService;

export function initScriptService(context: vscode.ExtensionContext) {
    scriptService = ScriptService.getInstance(context);
}
