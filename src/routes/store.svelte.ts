import type { Task } from "$api/client";
import Dagre from "@dagrejs/dagre";
import { SvelteMap, SvelteSet } from "svelte/reactivity";

type Position = { x: number; y: number };

class PosData {
    #isFirst: boolean = true;
    #last: Position;
    #target: Position;
    #current: Position;

    constructor(last: Position, target: Position) {
        this.#last = last;
        this.#target = target;
        this.#current = $derived(this.computeCurrent());
    }

    get current() {
        return this.#current;
    }

    private computeCurrent() {
        return {
            x: this.#last.x + (this.#target.x - this.#last.x) * nodePosAnimProgress,
            y: this.#last.y + (this.#target.y - this.#last.y) * nodePosAnimProgress,
        };
    }

    setTarget(newTarget: Position) {
        if (this.#isFirst) {
            [this.#last, this.#target] = [newTarget, newTarget];
            this.#isFirst = false;
        } else {
            [this.#last, this.#target] = [this.current, newTarget];
        }
    }
}

const tasks = $state(new SvelteMap<number, TaskData>());

export type TaskData = {
    task: Task,
    hrCompleted: number,
    hrRemaining: number,
    posData: PosData,
    invisible: boolean,
};

class TaskDataObj {
    #task: Task;
    #hrCompleted: number;
    #hrRemaining: number;
    #posData: PosData;

    constructor(task: Task) {
        this.#task = task;

        const hours = $derived({
            hrCompleted:
                (task.hoursHistory.at(-1)?.hr_completed ?? 0)
                + (
                    parentsToChildIds.get(task.id)?.values()
                        .map(childId => tasks.get(childId)?.hrCompleted ?? 0)
                        .reduce((a, b) => a + b, 0) 
                        ?? 0
                ),
            hrRemaining:
                (task.hoursHistory.at(-1)?.hr_remaining ?? 0)
                + (
                    parentsToChildIds.get(task.id)?.values()
                        .map(childId => tasks.get(childId)?.hrRemaining ?? 0)
                        .reduce((a, b) => a + b, 0) 
                        ?? 0
                ),
        });

        this.#hrCompleted = $derived(hours.hrCompleted);
        this.#hrRemaining = $derived(hours.hrRemaining);
        
        this.#posData = $state(new PosData({x: 0, y: 0}, {x: 0, y: 0}));
    }

    get task() {
        return this.#task;
    }

    get hrCompleted() {
        return this.#hrCompleted;
    }

    get hrRemaining() {
        return this.#hrRemaining;
    }

    get posData() {
        return this.#posData;
    }

    get invisible() {
        return this.#task.hidden || this.#task.trashed || this.#task.clear;
    }
}

const parentsToChildIds = $state(new SvelteMap<number, SvelteSet<number>>());

let nodePosAnimStartTime = Date.now();
let nodePosAnimProgress = $state(1);

const derived = $derived({
    tasks,
    parentsToChildIds,
});
export const get = () => derived;


export const addTask = (task: Task) => {
    const taskData = $state(new TaskDataObj(task));
    tasks.set(task.id, taskData);

    if (task.parent_id === null) return;

    const childIds = parentsToChildIds.get(task.parent_id);
    if (childIds !== undefined) {
        childIds.add(task.id);
    } else {
        parentsToChildIds.set(task.parent_id, new SvelteSet([task.id]));
    }
};

export const getTask = (id: number) => {
    return tasks.get(id);
};

export const delTask = (task: Task) => {
    tasks.delete(task.id);
    parentsToChildIds.delete(task.id);

    if (task.parent_id === null) return;

    const childIds = parentsToChildIds.get(task.parent_id);
    if (childIds !== undefined) {
        childIds.delete(task.id);
    }
};

export const initializeTasks = (tasks: Task[]) => {
    return Promise.all(tasks.map(task => {
        const taskProxy = $state(task);
        return addTask(taskProxy);
    }));
};

export const setNewTaskParent = (task: Task, parentId: number | null) => {
    if (task.parent_id === parentId) return;

    if (task.parent_id !== null) {
        parentsToChildIds.get(task.parent_id)?.delete(task.id);
    }

    task.parent_id = parentId;

    if (parentId === null) return;

    const childIds = parentsToChildIds.get(parentId);
    if (childIds !== undefined) {
        childIds.add(task.id);
    } else {
        parentsToChildIds.set(parentId, new SvelteSet([task.id]));
    }
};

const animate = () => {
    nodePosAnimProgress = Math.min((Date.now() - nodePosAnimStartTime) / 300, 1);
    updateNodePositions();
    if (nodePosAnimProgress >= 1) return;
    
    requestAnimationFrame(animate);
};

export const animateNodePositions = () => {
    nodePosAnimStartTime = Date.now();
    nodePosAnimProgress = 0;
    updateNodePositions();

    requestAnimationFrame(animate);
};

const updateNodePositions = () => {
    const graph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    graph.setGraph({ rankdir: "LR" });

    const nodeWidth = 300;
    const nodeHeight = 150;

    for (const [parentId, children] of parentsToChildIds) {
        for (const childId of children) {
            graph.setEdge(parentId.toString(), childId.toString());
        }
    }
    for (const task of tasks.values()) {
        graph.setNode(task.task.id.toString(), {
            width: nodeWidth,
            height: nodeHeight,
        });
    }

    Dagre.layout(graph);


    for (const task of tasks.values()) {
        const {x, y} = graph.node(task.task.id.toString());

        task.posData.setTarget({
            x: x - nodeWidth / 2,
            y: y - nodeHeight / 2,
        });
    }
};

const flowNodes = $derived.by(() => {
    const hasInvisibleAncestorResults = new Map<number, boolean>();

    const hasInvisibleAncestor = (taskData: TaskData): boolean => {
        const savedResult = hasInvisibleAncestorResults.get(taskData.task.id);
        if (savedResult !== undefined) {
            return savedResult;
        }


        let result: boolean;

        if (taskData.task.parent_id === null) {
            result = false;
        } else if (taskData.invisible) {
            result = true;
        } else {
            result = hasInvisibleAncestor(tasks.get(taskData.task.parent_id)!);
        }
        
        hasInvisibleAncestorResults.set(taskData.task.id, result);
        return result;
    };


    return tasks.values()
        .filter(taskData => !hasInvisibleAncestor(taskData))
        .map(taskData => {
            return {
                id: taskData.task.id.toString(),
                type: "task",
                position: taskData.posData.current,
                data: taskData,
            };
        })
        .toArray();
});

const flowEdges = $derived.by(() => {
    return parentsToChildIds.entries()
        .flatMap(([parentId, childIds]) =>
            childIds.values()
                .map(childId => ({
                    id: `e${parentId}-${childId}`,
                    type: "ancestry",
                    source: parentId.toString(),
                    target: childId.toString(),
                })
            )
        )
        .toArray();
});

export const getFlowNodes = () => flowNodes;
export const getFlowEdges = () => flowEdges;