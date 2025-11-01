import * as vscode from 'vscode';
import * as path from 'path';

export class Script {
    readonly uri: vscode.Uri;
    readonly relativePath: string;
    readonly name: string;
    readonly args: string[];

    readonly isLocal: boolean;

    constructor(scrpitPath: string | vscode.Uri, isLocal: boolean, args?: string[],) {
        this.uri = scrpitPath instanceof vscode.Uri ? scrpitPath : vscode.Uri.file(scrpitPath);

        const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const filePath = this.uri.fsPath;
        let relativePath: string;
        if (workspacePath) {
            relativePath = path.relative(workspacePath, filePath);
            const upLevelCount = (relativePath.match(/\.\.\//g) || []).length;
            if (upLevelCount > 2) {
                relativePath = filePath;
            }
        } else {
            relativePath = filePath;
        }
        this.relativePath = relativePath;

        let uriPart = this.uri.path.split('/');
        this.name = uriPart[uriPart.length - 1];

        this.args = args ?? [];
        this.isLocal = isLocal;
    }

    toString() {
        return this.uri.path;
    }

    async open() {
        const doc = await vscode.workspace.openTextDocument(this.uri);
        vscode.window.showTextDocument(doc);
    }

    public static fromObject(obj: Script): Script {
        return new Script(obj.uri.path, obj.isLocal, obj.args);
    }
}