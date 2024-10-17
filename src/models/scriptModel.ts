import * as vscode from 'vscode';
import * as path from 'path';

export class Script {
    readonly uri: vscode.Uri;
    readonly relativePath: string;
    readonly name: string;
    constructor(scrpitPath: string | vscode.Uri) {
        this.uri = scrpitPath instanceof vscode.Uri ? scrpitPath: vscode.Uri.file(scrpitPath);
        this.relativePath = path.relative(vscode.workspace.workspaceFolders?.[0].uri.path ?? '/', this.uri.path);
        let uriPart = this.uri.path.split('/');
        this.name = uriPart[uriPart.length - 1];
    }

    toString() {
        return this.uri.path;
    }

    async open() {
        const doc = await vscode.workspace.openTextDocument(this.uri);
        vscode.window.showTextDocument(doc);
    }

    public static fromObject(obj: Script): Script {
        return new Script(obj.uri.path);
    }
}