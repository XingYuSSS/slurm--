import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export enum TaskState {
    R = "RUNNING",
    PD = "PENDING",
    CG = "COMPLETING",
}


export class Gres {
    readonly type: string;
    readonly name: string | null = null;
    readonly other: string | null = null;
    readonly num: number;
    constructor(gres: string) {
        const slicedGres = (gres.startsWith('gres:') ? gres.substring(5) : gres).split(":");
        this.type = slicedGres[0];
        this.name = slicedGres.length > 2 ? slicedGres[1] : null;
        this.other = slicedGres.length > 3 ? slicedGres.slice(2, -1).join(":") : null;
        this.num = parseInt(slicedGres[slicedGres.length - 1]);
    }

    toString() {
        return this.type + (this.name ? ':' + this.name : '') + (this.other ? ':' + this.other : '') + ':' + this.num.toString();
    }
}


export class FilePath {
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


export class Task {
    readonly jobid: number;
    readonly name: string;
    readonly user: string;
    state: TaskState;
    readonly node: string;
    readonly gres: Gres;
    readonly limit_time: string;
    runing_time: string;
    readonly command: string;
    readonly out_path: FilePath;
    readonly err_path: FilePath;
    reason: string;
    finished: boolean;
    //JobID,Name:255,Username:20,State:20,NodeList,Gres:50,TimeLimit,TimeUsed,Command:255,STDOUT:255,STDERR:255,Reason:100
    constructor(jobid: string, name: string, user: string, state: string, node: string, gres: string, limit_time: string, runing_time: string, command: string, out_path: string, err_path: string, reason: string)
    constructor(jobid: number, name: string, user: string, state: string, node: string, gres: Gres, limit_time: string, runing_time: string, command: string, out_path: FilePath, err_path: FilePath, reason: string, finished: boolean)

    constructor(
        jobid: number | string,
        name: string,
        user: string,
        state: TaskState,
        node: string,
        gres: string | Gres,
        limit_time: string,
        runing_time: string,
        command: string,
        out_path: string | FilePath,
        err_path: string | FilePath,
        reason: string,
        finished?: boolean,
    ) {
        this.jobid = typeof jobid === "string" ? parseInt(jobid) : jobid;
        this.name = name;
        this.user = user;
        this.state = state;
        this.node = node;
        this.gres = typeof gres === "string" ? new Gres(gres) : gres;
        this.limit_time = limit_time;
        this.runing_time = runing_time;
        this.command = command;
        this.out_path = typeof out_path === "string" ? new FilePath(out_path.replace('%j', jobid.toString())) : out_path;
        this.err_path = typeof err_path === "string" ? new FilePath(err_path.replace('%j', jobid.toString())) : err_path;
        this.reason = reason === 'None' ? '' : reason;
        this.finished = finished??false;
    }

    public static fromObject(obj: Task): Task {
        return new Task(
            obj.jobid,
            obj.name,
            obj.user,
            obj.state,
            obj.node,
            obj.gres,
            obj.limit_time,
            obj.runing_time,
            obj.command,
            obj.out_path,
            obj.err_path,
            obj.reason,
            obj.finished
        );
    }

    public update(task: Task) {
        this.state = task.state;
        this.runing_time = task.runing_time;
        this.reason = task.reason;
    }

    public finish() {
        this.finished = true;
    }

}

export class TaskManager {
    private storagePath;
    private taskMap!: Map<number, Task>;
    private initing: boolean = true;

    private static _instance: TaskManager | null = null;
    private constructor(context: vscode.ExtensionContext) {
        this.storagePath = path.join(context.globalStorageUri.fsPath, 'tasks.json');
        const dir = path.dirname(this.storagePath);
        fs.mkdirSync(dir, { recursive: true });
        this.load_task();
        // console.log(this.storagePath)
    }

    static getInstance(context?: vscode.ExtensionContext): TaskManager {
        if (TaskManager._instance === null) {
            if (context === undefined) {
                throw new Error(`init ${this.name} failed.`);
            }
            TaskManager._instance = new TaskManager(context);
        }
        return TaskManager._instance;
    }

    private load_task() {
        if (fs.existsSync(this.storagePath)) {
            const jsonData = fs.readFileSync(this.storagePath, 'utf8');
            const saveMap = JSON.parse(jsonData);
            this.taskMap = new Map(saveMap);
            this.taskMap.forEach((v, k) => this.taskMap.set(k, Task.fromObject(v)));
            // console.log(this.taskMap)
            // console.log(typeof saveMap)
        } else {
            this.taskMap = new Map();
        }
    }

    private save_task() {
        const arrData = Array.from(this.taskMap.entries());
        console.log('save!')
        const jsonData = JSON.stringify(arrData, (k, v)=>{
            if (k === 'gres') {
                return Gres.prototype.toString.call(v);
            }
            if (k === 'out_path' || k === 'err_path') {
                return FilePath.prototype.toString.call(v);
            }
            return v;
        });
        fs.writeFile(this.storagePath, jsonData, 'utf8', () => { });
        
    }

    public addTask(...tasks: Task[]) {
        tasks.forEach(value => this.taskMap.set(value.jobid, value));
    }

    public updateTask(...tasks: Task[]) {
        console.log(this.taskMap)
        const newId = tasks.map(value => value.jobid);
        const oldId = [...this.taskMap.keys()];

        const updateId = newId.filter(value => oldId.includes(value));
        const addId = newId.filter(value => !updateId.includes(value));
        const dropId = oldId.filter(value => !updateId.includes(value));


        this.addTask(...tasks.filter(value => addId.includes(value.jobid)));
        tasks.filter(value => updateId.includes(value.jobid))
            .forEach(value => this.taskMap.get(value.jobid)?.update(value));
        dropId.forEach(v => this.taskMap.get(v)?.finish());

        this.save_task();
    }

    public deleteTask(...tasks: number[]): void;
    public deleteTask(...tasks: Task[]): void;
    public deleteTask(...tasks: Task[] | number[]): void {
        if (tasks.length === 0) {
            return;
        }
        if (typeof tasks[0] === "number") {
            tasks.forEach(value => this.taskMap.delete(value as number));
        } else {
            tasks.forEach(value => this.taskMap.delete((value as Task).jobid));
        }
    }

    public getTask(): Task[] {
        return [...this.taskMap.values()];
    }

}

export let taskManager: TaskManager;

export function initTaskManager(context: vscode.ExtensionContext) {
    taskManager = TaskManager.getInstance(context);
}
