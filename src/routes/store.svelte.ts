import type { Task } from "$api/client";
import Dagre from "@dagrejs/dagre";
import { tick } from "svelte";
import { SvelteMap, SvelteSet } from "svelte/reactivity";

type Position = { x: number; y: number };

class PosData {
    #isFirst: boolean = true;
    #last: Position;
    #target: Position;
    #current: Position;

    constructor(last: Position, target: Position) {
        this.#last = $state(last);
        this.#target = $state(target);
        this.#current = $derived.by(() => {
            if (nodeEase === 1) {
                return this.#target;
            }
            
            return {
                x: this.#last.x + (this.#target.x - this.#last.x) * nodeEase,
                y: this.#last.y + (this.#target.y - this.#last.y) * nodeEase,
            };
        });
    }

    get current() {
        return this.#current;
    }

    setTarget(newTarget: Position) {
        if (this.#isFirst) {
            this.#last = newTarget;
            this.#target = newTarget;
            
            this.#isFirst = false;
        } else {
            this.#last = this.#current;
            this.#target = newTarget;
        }
    }
}

const tasks = $state(new SvelteMap<number, TaskData>());

export type TaskData = {
    task: Task,
    hrCompleted: number,
    hrRemaining: number,
    hrEstimateOriginal: number,
    posData: PosData,
    elHeight: number,
};

class TaskDataObj {
    #task: Task;
    #hrCompleted: number;
    #hrRemaining: number;
    #hrEstimateOriginal: number;
    #posData: PosData;
    elHeight: number;

    constructor(task: Task) {
        this.#task = task;

        this.#hrCompleted = $derived(
            (task.hoursHistory.at(-1)?.hr_completed ?? 0)
                + (
                    parentsToChildIds.get(task.id)?.values()
                        .map(childId => tasks.get(childId)?.hrCompleted ?? 0)
                        .reduce((a, b) => a + b, 0) 
                        ?? 0
                )
        );
        this.#hrRemaining = $derived(
            (task.hoursHistory.at(-1)?.hr_remaining ?? 0)
                + (
                    parentsToChildIds.get(task.id)?.values()
                        .map(childId => tasks.get(childId)?.hrRemaining ?? 0)
                        .reduce((a, b) => a + b, 0) 
                        ?? 0
                )
        );
        this.#hrEstimateOriginal = $derived(
            (task.hoursHistory[0].hr_completed + task.hoursHistory[0].hr_remaining)
                + (
                    parentsToChildIds.get(task.id)?.values()
                        .map(childId => tasks.get(childId)?.hrEstimateOriginal ?? 0)
                        .reduce((a, b) => a + b, 0) 
                        ?? 0
                )
        );
        
        this.#posData = new PosData({x: 0, y: 0}, {x: 0, y: 0});


        this.elHeight = 0;
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

    get hrEstimateOriginal() {
        return this.#hrEstimateOriginal;
    }

    get posData() {
        return this.#posData;
    }
}

const parentsToChildIds = $state(new SvelteMap<number, SvelteSet<number>>());

let nodePosAnimStartTime = Date.now();
let nodePosAnimProgress = $state(1);
const nodeEase = $derived(1 - (1 - nodePosAnimProgress)**3);

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
    nodePosAnimProgress = Math.min((Date.now() - nodePosAnimStartTime) / 500, 1);
    if (nodePosAnimProgress >= 1) return;
    
    requestAnimationFrame(animate);
};

export const animateNodePositions = () => {
    nodePosAnimStartTime = Date.now();
    updateNodePositions();

    nodePosAnimProgress = 0;
    requestAnimationFrame(animate);
};

const nodeWidth = 500;
const graph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
graph.setGraph({ rankdir: "LR" });

const updateNodePositions = () => {
    for (const [parentId, children] of parentsToChildIds) {
        for (const childId of children) {
            if (!visibleTasks.has(parentId) || !visibleTasks.has(childId)) {
                graph.removeEdge(parentId.toString(), childId.toString());
            } else {
                graph.setEdge(parentId.toString(), childId.toString());
            }
        }
    }
    for (const taskData of tasks.values()) {
        if (!visibleTasks.has(taskData.task.id)) {
            graph.removeNode(taskData.task.id.toString());
        } else {
            graph.setNode(taskData.task.id.toString(), {
                width: nodeWidth,
                height: taskData.elHeight,
            });            
        }
    }

    Dagre.layout(graph);


    for (const taskData of visibleTasks.values()) {
        const {x, y} = graph.node(taskData.task.id.toString());

        taskData.posData.setTarget({
            x: x - nodeWidth / 2,
            y: y - taskData.elHeight / 2,
        });
    }
};

const visibleTasks = $derived.by(() => {
    const hasInvisibleAncestorResults = new Map<number, boolean>();

    const hasInvisibleAncestor = (taskData: TaskData): boolean => {
        const savedResult = hasInvisibleAncestorResults.get(taskData.task.id);
        if (savedResult !== undefined) {
            return savedResult;
        }


        let result: boolean;

        if (taskData.task.parent_id === null) {
            result = false;
        } else if (taskData.task.clear || taskData.task.trashed) {
            result = true;
        } else {
            const parent = tasks.get(taskData.task.parent_id);

            if (parent === undefined) {
                result = true;
            } else if (parent.task.hide_children) {
                result = true;
            } else {
                result = hasInvisibleAncestor(parent);
            }
        }
        
        hasInvisibleAncestorResults.set(taskData.task.id, result);
        return result;
    };


    return new Map(
        tasks.values()
            .filter(taskData => !hasInvisibleAncestor(taskData))
            .map(taskData => [taskData.task.id, taskData])
    );
});

const flowNodes = $derived.by(() => {
    return visibleTasks.values()
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