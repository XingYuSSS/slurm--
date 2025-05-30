import { BaseTask, TaskState } from "./baseTask";
import { Task, TaskObj } from "./taskModel";


export interface TaskArrayObj {
    subTasks: TaskObj[];
    type: 'TaskArray';
}


export class TaskArray implements BaseTask {
    readonly subTasks: Record<number, Task>;
    readonly jobid: number;
    readonly jobArrayId: string[];
    readonly name: string;

    finished: boolean;

    constructor(subTasks: Task[]) {
        this.subTasks = subTasks.reduce<Record<number, Task>>((acc, current) => {
            acc[current.arrayid!] = current;
            return acc;
        }, {});
        this.jobid = subTasks[0].jobid;
        this.jobArrayId = subTasks.map(v => v.jobArrayId);
        this.name = subTasks[0].name + ` <${subTasks.length}>`;
        this.finished = this.getSubTasks().every(v => v.finished);
    }

    
    public get state() : TaskState {
        const tasks = this.getSubTasks();
        if (tasks.some(item => item.state === TaskState.R)) {
            return TaskState.R;
        } else if (tasks.some(item => item.state === TaskState.PD)) {
            return TaskState.PD;
        } else {
            return TaskState.CG;
        }
    }


    public update(array: TaskArray) {
        for (const [key, value] of Object.entries(array.subTasks)) {
            this.subTasks[Number(key)].update(value);
        }
    }

    public finish(endTimes: Record<number, string>) {
        for (const [key, value] of Object.entries(endTimes)) {
            this.subTasks[Number(key)].finish(value);
        }
        this.finished = this.getSubTasks().every(v => v.finished);
    }

    public toObj(): TaskArrayObj {
        return {
            type: 'TaskArray',
            subTasks: this.getSubTasks().map(v => v.toObj())
        };
    }

    static fromObj(obj: TaskArrayObj) {
        return new TaskArray(obj.subTasks.map(v => Task.fromObj(v)));
    }

    public getSubTasks(): Task[] {
        return Object.values(this.subTasks);
    }

}
