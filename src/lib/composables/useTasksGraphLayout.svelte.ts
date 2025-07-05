import Dagre, { graphlib } from "@dagrejs/dagre";
import type { ReactiveTask, useTasksSet } from "./useTasksSet.svelte";
import { SvelteMap } from "svelte/reactivity";
import type { Edge, Node, NodeTypes } from "@xyflow/svelte";
import { untrack } from "svelte";


export class GraphTask {
    task: ReactiveTask = $state()!;

    readonly elDimensions = $state({
        width: 0,
        height: 0,
    });

    flowNode: Node<Record<string, any>> = $derived({
        id: this.task.id.toString(),
        type: "task",
        position: this.task.pos,
        data: this,
    });
    
    flowEdge: Edge | null = $derived.by(() => {
        if (this.task.parentId === null) return null;
        
        return {
            id: `e${this.task.parentId}-${this.task.id}`,
            type: "ancestry",
            source: this.task.parentId.toString(),
            target: this.task.id.toString(),
        };
    });

    constructor(task: ReactiveTask) {
        this.task = task;
    }
}

export const useTasksGraphLayout = ({
    tasks,
    tasksSet,
}: {
    tasks: Set<ReactiveTask>,
    tasksSet: ReturnType<typeof useTasksSet>,
}) => {
    const graphTasks = $state(new SvelteMap<ReactiveTask, GraphTask>());

    const layoutGraph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    layoutGraph.setGraph({ rankdir: "LR", align: "UL", nodesep: 5 });

    // const maxWidth = $derived(Math.max(
    //     ...graphTasks.values()
    //         .map(graphTask => graphTask.elDimensions.width)
    // ));

    const width = 600;

    let updateRequested = false;
    const requestUpdateNodePositions = () => {
        if (updateRequested) return;

        updateRequested = true;

        requestAnimationFrame(() => {
            Dagre.layout(layoutGraph, {disableOptimalOrderHeuristic: true});

            for (const task of tasks) {
                const {x, y} = layoutGraph.node(task.id.toString());

                task.pos = {
                    x: x - width / 2,
                    y: y - (untrack(() => graphTasks).get(task)?.elDimensions.height ?? 0) / 2,
                };
            }
            
            updateRequested = false;
        });
    };

    const removeFromGraph = (childId: number, parentId: number | null) => {
        layoutGraph.removeNode(childId.toString());

        if (parentId !== null) {
            layoutGraph.removeEdge(parentId.toString(), childId.toString());
        }

        requestUpdateNodePositions();
    };

    const addToGraph = (task: ReactiveTask) => {
        layoutGraph.setNode(task.id.toString(), {
            width: width,
            height: untrack(() => graphTasks).get(task)?.elDimensions.height ?? 0,
        });

        if (task.parentId !== null) {
            layoutGraph.setEdge(task.parentId.toString(), task.id.toString());
        }

        requestUpdateNodePositions();
    };

    tasksSet.taskEffect(task => {
        let lastId: number | undefined = undefined;
        let lastParentId: number | null | undefined = undefined;

        const visible = $derived(tasks.has(task));

        $effect(() => {
            if (visible) {
                if ((lastId !== task.id || lastParentId !== task.parentId) && lastId !== undefined && lastParentId !== undefined) {
                    removeFromGraph(lastId!, lastParentId!);
                }
                addToGraph(task);

                if (!untrack(() => graphTasks).has(task)) {
                    graphTasks.set(task, new GraphTask(task));
                }
                
            } else {
                removeFromGraph(task.id, task.parentId);

                if (untrack(() => graphTasks).has(task)) {
                    graphTasks.delete(task);
                }
            }
        
            lastId = task.id;
            lastParentId = task.parentId;
        });
    });

    tasksSet.onDelTask(task => {
        removeFromGraph(task.id, task.parentId);
        graphTasks.delete(task);
    });
    
        
    const flowNodes = $derived.by(() => {
        return graphTasks.values()
            .map(graphTask => graphTask.flowNode)
            .toArray();
    });

    const flowEdges = $derived.by(() => {
        return graphTasks.values()
            .map(graphTask => graphTask.flowEdge)
            .filter(edge => edge !== null)
            .toArray();
    });

    return {
        get flowNodes() {
            return flowNodes;
        },
    
        get flowEdges() {
            return flowEdges;
        },
    }
};