import * as vscode from 'vscode';

import { Node, NodeState, SbatchArgument, SbatchParsedArgs } from '../models';
import { resourceService, contextManager } from '../services';
import { SBATCH_PARAMS } from "../constants";


type CompletionRange = vscode.Range | {
    inserting: vscode.Range;
    replacing: vscode.Range;
}

export class SbatchCompletionProvider implements vscode.CompletionItemProvider {
    constructor() { }

    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.CompletionItem[] | Thenable<vscode.CompletionItem[]> {
        const line = document.lineAt(position.line).text;

        if (!line.startsWith('#SBATCH')) { return []; }

        const context = contextManager.getContext(document);
        const currentValue = context.getCurrentValue(position);
        const lastArg = context.getPreviousArg(position);

        if (!currentValue && (!lastArg || lastArg.value)) {
            return [];
        }

        const arg: SbatchArgument = currentValue ?? lastArg!;
        const range = arg.valueRange ? {
            inserting: arg.valueRange.with(undefined, position),
            replacing: arg.valueRange
        } : undefined;

        switch (arg.param) {
            case 'partition':
                return this.getPartitionCompletions(context.context, range);
            case 'gres':
                return this.getGresCompletions(context.context, range);
            case 'nodelist':
                return this.getNodeCompletions(context.context, range);
            default:
                return [];
        }
    }

    private getNodesDoc(nodes: Node[]) {
        return new vscode.MarkdownString(`
| nodeid | state | GRES (idle/total) | memory (i/t) | CPUs (i/t) |
|:--:|:--:|:--:|:--:|:--:|
${nodes.slice(0, 10).map(node => `| ${node.nodeid} | ${node.state} | ${node.gres ?? 'No GRES'} | ${Math.round((node.memory - node.allocMemory) * 1000) / 1000}GB / ${node.memory}GB | ${node.idleCpu} / ${node.cpu} |`).join('\n')}
${nodes.length > 10 ? '|...|...|...|...|...|' : ''}
    `);
    }

    private getPartitionCompletions(context: SbatchParsedArgs, range?: CompletionRange): vscode.CompletionItem[] {
        const partitionMap = resourceService.getNodeByPartition();

        return [...partitionMap].map(([partition, { nodes }]) => {
            const item = new vscode.CompletionItem(partition, vscode.CompletionItemKind.Constant);

            item.detail = vscode.l10n.t('{length} nodes', { length: nodes.length });
            item.documentation = this.getNodesDoc(nodes);
            item.range = range;

            return item;
        });
    }

    private getGresCompletions(context: SbatchParsedArgs, range?: CompletionRange): vscode.CompletionItem[] {
        const gresMap = context.partition
            ? resourceService.getNodeByPartitionGres().get(context.partition)!
            : resourceService.getNodesByGres();

        return [...gresMap]
            .filter(([id]) => id !== null)
            .map(([id, { gres, nodes }]) => {
                const item = new vscode.CompletionItem(gres!.toIdString(), vscode.CompletionItemKind.Value);

                item.detail = vscode.l10n.t('{length} nodes', { length: nodes.length });
                item.documentation = this.getNodesDoc(nodes);
                item.insertText = new vscode.SnippetString().appendText(gres!.toIdString() + ':').appendChoice(Array.from({ length: 9 }, (_, i) => i).map(v => v.toString()));
                item.range = range;

                return item;
            });
    }

    private getNodeDetail(node: Node): string {
        if (node.state === NodeState.ALLOC) { return vscode.l10n.t(`Node has been allocated`); }
        if (node.state === NodeState.IDLE || node.state === NodeState.MIXED) {
            return `${node.gres ?? 'No GRES'} \t${Math.round((node.memory - node.allocMemory) * 1000) / 1000}GB / ${node.memory}GB \t${node.idleCpu} / ${node.cpu} CPUs`;
        }
        return vscode.l10n.t(`Node not available due to state "{0}"`, node.state);
    }

    private getNodeCompletions(context: SbatchParsedArgs, range?: CompletionRange): vscode.CompletionItem[] {
        const nodes = resourceService.getNode()
            .filter(n => !context.partition || n.partition === context.partition)
            .filter(n => !context.gres || n.gres?.toIdString() === context.gres.toIdString());

        return [...nodes].map(node => {
            const item = new vscode.CompletionItem(node.nodeid, vscode.CompletionItemKind.Variable);

            item.detail = this.getNodeDetail(node);
            item.documentation = this.getNodesDoc([node]);
            item.range = range;

            return item;
        });
    }
}

function getPrefixDashRange(line: string, position: vscode.Position): vscode.Range | undefined {
    const match = line.slice(0, position.character).match(/-(-?)$/);
    return match ? new vscode.Range(position.line, position.character - match[0].length, position.line, position.character) : undefined;
}

export class SbatchParameterCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.CompletionItem[] | Thenable<vscode.CompletionItem[]> {
        const line = document.lineAt(position.line).text;

        if (!line.startsWith('#SBATCH')) { return []; }

        const context = contextManager.getContext(document);

        const currentValue = context.getCurrentValue(position);
        if (currentValue) {
            return [];
        }

        const currentArg = context.getCurrentArg(position);
        const range = currentArg
            ? {
                inserting: currentArg.paramRange.with(undefined, position),
                replacing: currentArg.paramRange
            }
            : getPrefixDashRange(line, position);


        return this.getParameterCompletions(context.context, range);
    }

    private getParameterCompletions(context: SbatchParsedArgs, range?: CompletionRange): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];

        for (const option of SBATCH_PARAMS) {
            const item = new vscode.CompletionItem(`--${option.long}`, vscode.CompletionItemKind.Property);

            item.detail = option.description;
            item.documentation = new vscode.MarkdownString(
                `**--${option.long}**\n\n${option.description}\n\nSee [${option.long}](https://slurm.schedmd.com/sbatch.html#OPT_${option.long}) for details.`
            );
            item.insertText = new vscode.SnippetString(`--${option.long}`);
            item.range = range;

            items.push(item);

            if (option.short) {
                const item = new vscode.CompletionItem(`-${option.short}`, vscode.CompletionItemKind.Property);

                item.detail = option.description;
                item.documentation = new vscode.MarkdownString(
                    `**-${option.short}**\n\n--${option.long}\n\n${option.description}\n\nSee [${option.long}](https://slurm.schedmd.com/sbatch.html#OPT_${option.long}) for details.`
                );
                item.insertText = new vscode.SnippetString(`-${option.short}`);
                item.range = range;
                item.sortText = '---' + option.short;

                items.push(item);
            }
        }

        return items;
    }
}

export class SbatchPrefixProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CompletionItem[]> {
        const linePrefix = document.lineAt(position).text.substring(0, position.character);

        if (!'#sbatch'.startsWith(linePrefix.toLowerCase())) {
            return [];
        }

        const item = new vscode.CompletionItem('#SBATCH', vscode.CompletionItemKind.Snippet);
        item.insertText = new vscode.SnippetString('SBATCH ');
        item.detail = 'Insert SLURM batch directive prefix';
        item.filterText = '#SBATCH';

        return [item];
    }
}

const completionParamProvider = new SbatchParameterCompletionProvider();
const completionProvider = new SbatchCompletionProvider();
const prefixProvider = new SbatchPrefixProvider();

export function initCompletion(context: vscode.ExtensionContext) {

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { language: 'shellscript' },
            completionProvider,
            '=', ' ',
        )
    );

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { language: 'shellscript' },
            completionParamProvider,
            '-',
        )
    );

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { language: 'shellscript' },
            prefixProvider,
            '#',
        )
    );
}