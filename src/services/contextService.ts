import * as vscode from 'vscode';

import { SbatchContext } from '../models';

class ContextService {
    private contextMap = new Map<string, SbatchContext>();

    public getContext(document: vscode.TextDocument): SbatchContext {
        const uri = document.uri.toString();
        if (!this.contextMap.has(uri)) {
            this.contextMap.set(uri, new SbatchContext(document));
        }
        return this.contextMap.get(uri)!;
    }

    constructor(context: vscode.ExtensionContext) {
        const onChange = vscode.workspace.onDidChangeTextDocument(this.onDidChangeTextDocument, this);
        const onClose = vscode.workspace.onDidCloseTextDocument(this.onDidCloseTextDocument, this);

        context.subscriptions.push(onChange, onClose);
    }

    private onDidChangeTextDocument(e: vscode.TextDocumentChangeEvent) {
        if (e.document.languageId !== 'shellscript') { return; }

        const uri = e.document.uri.toString();
        if (!this.contextMap.has(uri)) { return; }

        for (const change of e.contentChanges) {
            const startLine = e.document.positionAt(change.rangeOffset).line;
            const endLine = e.document.positionAt(change.rangeOffset + change.rangeLength).line;

            for (let i = startLine; i <= endLine; i++) {
                const line = e.document.lineAt(i).text;
                if (line.startsWith('#SBATCH')) {
                    this.contextMap.delete(uri);
                    return;
                }
            }
        }
    }

    private onDidCloseTextDocument(doc: vscode.TextDocument) {
        this.contextMap.delete(doc.uri.toString());
    }
}

export let contextManager: ContextService;

export function initContextService(context: vscode.ExtensionContext) {
    contextManager = new ContextService(context);
}
