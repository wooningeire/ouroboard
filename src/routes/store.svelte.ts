import type { api, Task } from "$api/client";
import type { Node, Edge } from "@xyflow/svelte";
import Dagre from "@dagrejs/dagre";
import { SvelteMap, SvelteSet } from "svelte/reactivity";

export type AugmentedTask = {
    base: Task,
    hrCompleted: () => number,
    hrRemaining: () => number,
};

const tasks = $state(new SvelteMap<number, AugmentedTask>());

const parentsToChildIds = $state(new SvelteMap<number, SvelteSet<number>>());

const derived = $derived({
    tasks,
    parentsToChildIds,
});
export const get = () => derived;


const computeHours = (task: Task) => {
    return {
        hrCompleted:
            (task.hoursHistory.at(-1)?.hr_completed ?? 0)
            + (
                parentsToChildIds.get(task.id)?.values()
                    .map(childId => tasks.get(childId)?.hrCompleted() ?? 0)
                    .reduce((a, b) => a + b, 0) 
                    ?? 0
            ),
        hrRemaining:
            (task.hoursHistory.at(-1)?.hr_remaining ?? 0)
            + (
                parentsToChildIds.get(task.id)?.values()
                    .map(childId => tasks.get(childId)?.hrRemaining() ?? 0)
                    .reduce((a, b) => a + b, 0) 
                    ?? 0
            ),
    };
};

export const addTask = (task: Task) => {
    const hours = $derived(computeHours(task));

    const hrCompleted = $derived(hours.hrCompleted);
    const hrRemaining = $derived(hours.hrRemaining);

    tasks.set(task.id, {
        base: task,
        hrCompleted: () => hrCompleted,
        hrRemaining: () => hrRemaining,
    });

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
    for (const task of tasks) {
        const taskProxy = $state(task);
        addTask(taskProxy);
    }
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

const layoutNodes = () => {
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
        graph.setNode(task.base.id.toString(), {
            width: nodeWidth,
            height: nodeHeight,
        });
    }

    Dagre.layout(graph);

    return {
        nodes: tasks.values()
            .map(task => {
                const {x,y} = graph.node(task.base.id.toString());
                return {
                    id: task.base.id.toString(),
                    type: "task",
                    position: {
                        // We are shifting the dagre node position (anchor=center center) to the top left
                        // so it matches the Svelte Flow node anchor point (top left).
                        x: x - nodeWidth / 2,
                        y: y - nodeHeight / 2,
                    },
                    data: task,
                };
            })
            .toArray(),

        edges: parentsToChildIds.entries()
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
            .toArray(),
    };

};

const flowObjects = $derived(layoutNodes());

export const getFlowObjects = () => flowObjects;