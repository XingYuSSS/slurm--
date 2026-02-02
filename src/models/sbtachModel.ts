import * as vscode from 'vscode';

import * as shellQuote from 'shell-quote';

import { Gres } from './gresModel';
import { SBATCH_SHORT_TO_LONG } from "../constants";

export interface SbatchParam {
    readonly short?: string;
    readonly long: string;
    readonly description: string;
    readonly hasValue: boolean;
}

export interface SbatchArgument {
    param: string;
    paramRange: vscode.Range;
    value?: string;
    valueRange?: vscode.Range;
}

export interface SbatchParsedArgs {
    partition?: string;
    gres?: Gres;
    nodelist?: string;
    time?: string;
    nodes?: string;
    jobName?: string;
}


function extractValue(text: string, startPos: number): { value: string; start: number; end: number } | null {
    if (startPos >= text.length) { return null; }
    if (text.charAt(startPos) === '-') { return null; }

    let i;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    for (i = startPos; i < text.length; i++) {
        const char = text[i];

        if (char === "'" && !inDoubleQuote) { inSingleQuote = !inSingleQuote; }
        else if (char === '"' && !inSingleQuote) { inDoubleQuote = !inDoubleQuote; }
        else if (char === '\\') {
            if (i + 1 < text.length) { i++; }
        }
        else if (!inSingleQuote && !inDoubleQuote) {
            if (/\s/.test(char)) { break; }
        }
    }

    const value = shellQuote.parse(text.substring(startPos, i));

    return {
        value: value[0] as string,
        start: startPos,
        end: i
    };
}

function removeComment(text: string) {
    const last = shellQuote.parse(text.slice(7)).pop();
    if (typeof last !== 'object' || 'op' in last) {
        return text;
    }
    return text.slice(0, - last.comment.length - 1);
}


function parseArgs(document: vscode.TextDocument): SbatchArgument[] {
    const result: SbatchArgument[] = [];

    for (let lineNum = 0; lineNum < document.lineCount; lineNum++) {
        const line = document.lineAt(lineNum);
        const rawText = line.text;

        const trimmed = rawText.trim();
        if (trimmed === '') { continue; }
        if (!rawText.startsWith('#SBATCH')) {
            if (!trimmed.startsWith('#')) {
                break;
            }
            continue;
        }

        const text = removeComment(rawText);

        const LONG_REGEX = /(?<!-)(--([a-zA-Z][a-zA-Z0-9_-]*))(?:=|\s+)/g;
        let match;
        while ((match = LONG_REGEX.exec(text)) !== null) {
            const param = match[2];
            const paramEnd = match.index + match[0].length;

            const valueInfo = extractValue(text, paramEnd);
            result.push({
                param,
                paramRange: new vscode.Range(lineNum, match.index, lineNum, match.index + match[1].length),
                value: valueInfo?.value,
                valueRange: valueInfo ? new vscode.Range(lineNum, valueInfo.start, lineNum, valueInfo.end) : undefined
            });
        }

        const SHORT_REGEX = /(?<!-)(-([a-zA-Z]))\s*/g;
        while ((match = SHORT_REGEX.exec(text)) !== null) {
            const shortKey = match[2];
            const paramEnd = match.index + match[0].length;

            const valueInfo = extractValue(text, paramEnd);
            const longParam = SBATCH_SHORT_TO_LONG[shortKey];
            result.push({
                param: longParam ?? shortKey,
                paramRange: new vscode.Range(lineNum, match.index, lineNum, match.index + match[1].length),
                value: valueInfo?.value,
                valueRange: valueInfo ? new vscode.Range(lineNum, valueInfo.start, lineNum, valueInfo.end) : undefined
            });
        }
    }

    return result;
}

function getContext(args: SbatchArgument[]): SbatchParsedArgs {
    const context: SbatchParsedArgs = {};

    for (const arg of args) {
        switch (arg.param) {
            case 'partition': context.partition = arg.value; break;
            case 'gres':
                context.gres = arg.value ? new Gres(arg.value) : undefined;
                break;
            case 'job-name': context.jobName = arg.value; break;
            case 'time': context.time = arg.value; break;
            case 'nodes': context.nodes = arg.value; break;
            case 'nodelist': context.nodelist = arg.value; break;
        }
    }

    return context;
}

export class SbatchContext {
    public readonly args: SbatchArgument[];
    public readonly context: SbatchParsedArgs;

    constructor(document: vscode.TextDocument) {
        const rawArgs = parseArgs(document);
        this.args = rawArgs.sort((a, b) =>
            a.paramRange.start.compareTo(b.paramRange.start)
        );
        this.context = getContext(this.args);
    }

    getCurrentArg(pos: vscode.Position): SbatchArgument | null {
        return this.args.find(a =>
            a.paramRange.contains(pos) || a.paramRange.end.isEqual(pos)
        ) ?? null;
    }

    getCurrentValue(pos: vscode.Position): SbatchArgument | null {
        return this.args.find(a =>
            a.valueRange?.contains(pos) || a.valueRange?.end.isEqual(pos)
        ) ?? null;
    }

    getPreviousArg(pos: vscode.Position): SbatchArgument | null {
        let last: SbatchArgument | null = null;
        for (const arg of this.args) {
            if (arg.paramRange.end.isBeforeOrEqual(pos)) {
                last = arg;
            } else {
                break;
            }
        }
        return last;
    }
}
