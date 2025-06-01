import { TaskArray, TaskArrayObj } from "./arrayModel";
import { BaseTask } from "./baseTask";
import { Task, TaskObj } from "./taskModel";

export * from "./baseTask";
export * from "./taskModel";
export * from "./arrayModel";

const TaskTypes = {
    Task,
    TaskArray,
};

export type TaskObjTypes = TaskObj | TaskArrayObj

export function loadObj(data: TaskObjTypes): BaseTask {
    const cls = data.type ? TaskTypes[data.type] : Task;
    if (!cls) { throw new Error(`Unknown task type: ${data.type}`); }
    return cls.fromObj(data as any);
}
