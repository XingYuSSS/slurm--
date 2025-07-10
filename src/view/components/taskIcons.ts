import * as vscode from 'vscode';
import { TaskState } from '../../models';

export const taskStateIconMap: Partial<Record<TaskState, vscode.ThemeIcon>> = {
    [TaskState.R]: new vscode.ThemeIcon('debug-start', new vscode.ThemeColor('gitDecoration.addedResourceForeground')),
    [TaskState.PD]: new vscode.ThemeIcon('watch', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground')),
    [TaskState.CG]: new vscode.ThemeIcon('pass', new vscode.ThemeColor('gitDecoration.addedResourceForeground')),
    
    [TaskState.COMPLETED]: new vscode.ThemeIcon('pass', new vscode.ThemeColor('gitDecoration.addedResourceForeground')),
    [TaskState.FAILED]: new vscode.ThemeIcon('error', new vscode.ThemeColor('gitDecoration.deletedResourceForeground')),
    [TaskState.CANCELLED]: new vscode.ThemeIcon('trash', new vscode.ThemeColor('gitDecoration.deletedResourceForeground')),
    [TaskState.TIMEOUT]: new vscode.ThemeIcon('watch', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground')),
    [TaskState.NODE_FAIL]: new vscode.ThemeIcon('server-environment', new vscode.ThemeColor('gitDecoration.deletedResourceForeground')),
    [TaskState.OUT_OF_MEMORY]: new vscode.ThemeIcon('bug', new vscode.ThemeColor('gitDecoration.deletedResourceForeground')),
};

export const unknownStateIcon = new vscode.ThemeIcon('question', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground')); 