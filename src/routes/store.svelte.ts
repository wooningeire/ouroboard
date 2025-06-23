import type { api, Task } from "$api/client";
import type { Node, Edge } from "@xyflow/svelte";
import Dagre from "@dagrejs/dagre";
import { SvelteMap, SvelteSet } from "svelte/reactivity";

export type AugmentedTask = {
    base: Task,
    hrComplete: () => number,
    hrRemaining: () => number,
};

const state = $state({
    tasks: new SvelteMap<number, AugmentedTask>(),
    parentsToChildIds: new SvelteMap<number, SvelteSet<number>>(),
});

const derived = $derived(state);

export const get = () => derived;


const computeHours = (task: Task) => {
    return {
        hrComplete:
            (task.hoursHistory[0]?.hr_completed ?? 0)
            + (
                state.parentsToChildIds.get(task.id)?.values()
                    .map(childId => state.tasks.get(childId)?.hrComplete() ?? 0)
                    .reduce((a, b) => a + b, 0) 
                    ?? 0
            ),
        hrRemaining:
            (task.hoursHistory[0]?.hr_remaining ?? 0)
            + (
                state.parentsToChildIds.get(task.id)?.values()
                    .map(childId => state.tasks.get(childId)?.hrRemaining() ?? 0)
                    .reduce((a, b) => a + b, 0) 
                    ?? 0
            ),
    };
};

export const addTask = (task: Task) => {
    const hours = $derived(computeHours(task));

    const hrComplete = $derived(hours.hrComplete);
    const hrRemaining = $derived(hours.hrRemaining);

    state.tasks.set(task.id, {
        base: task,
        hrComplete: () => hrComplete,
        hrRemaining: () => hrRemaining,
    });

    if (task.parent_id === null) return;

    const childIds = state.parentsToChildIds.get(task.parent_id);
    if (childIds !== undefined) {
        childIds.add(task.id);
    } else {
        state.parentsToChildIds.set(task.parent_id, new SvelteSet([task.id]));
    }
};

export const getTask = (id: number) => {
    return state.tasks.get(id);
};

export const delTask = (task: Task) => {
    state.tasks.delete(task.id);

    state.parentsToChildIds.delete(task.id);

    if (task.parent_id === null) return;

    const childIds = state.parentsToChildIds.get(task.parent_id);
    if (childIds !== undefined) {
        childIds.delete(task.id);
    }
};

// export const addEdge = (edge: {
//     parentId: number,
//     childId: number,
// }) => {
//     state.edges.add(edge);
// };

export const initializeTasks = (tasks: Task[]) => {
    for (const task of tasks) {
        addTask(task);
    }
};


const layoutNodes = () => {
    const graph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    graph.setGraph({ rankdir: "LR" });

    const nodeWidth = 300;
    const nodeHeight = 125;

    for (const [parentId, children] of state.parentsToChildIds) {
        for (const childId of children) {
            graph.setEdge(parentId.toString(), childId.toString());
        }
    }
    for (const task of state.tasks.values()) {
        graph.setNode(task.base.id.toString(), {
            width: nodeWidth,
            height: nodeHeight,
        });
    }

    Dagre.layout(graph);

    return {
        nodes: state.tasks.values()
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

        edges: state.parentsToChildIds.entries()
            .flatMap(([parentId, childIds]) => 
                childIds.values()
                    .map(childId => ({
                        id: `e${parentId}-${childId}`,
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