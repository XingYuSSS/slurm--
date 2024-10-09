import * as vscode from 'vscode';

export class LogFile {
    readonly uri: vscode.Uri;
    readonly name: string;
    constructor(path: string) {
        this.uri = vscode.Uri.file(path);
        let uriPart = path.split('/');
        this.name = uriPart[uriPart.length - 1];
    }

    toString() {
        return this.uri.path;
    }

    async open() {
        const doc = await vscode.workspace.openTextDocument(this.uri);
        vscode.window.showTextDocument(doc);
    }
}