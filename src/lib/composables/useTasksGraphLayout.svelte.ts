import Dagre, { graphlib } from "@dagrejs/dagre";
import type { ReactiveTask, useTasks } from "./useTasks.svelte";
import { SvelteSet } from "svelte/reactivity";
import type { useTasksSorter } from "./useTasksSorter.svelte";
import { untrack } from "svelte";

export const useTasksGraphLayout = ({
    tasks,
    tasksSorter,
    tasksSet,
}: {
    tasks: Set<ReactiveTask>,
    tasksSorter: ReturnType<typeof useTasksSorter>,
    tasksSet: ReturnType<typeof useTasks>,
}) => {
    const nodeWidth = 600;
    const layoutGraph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    layoutGraph.setGraph({ rankdir: "LR", align: "UL", nodesep: 5 });

    let updateRequested = false;
    const requestUpdateNodePositions = () => {
        if (updateRequested) return;

        updateRequested = true;

        requestAnimationFrame(() => {
            Dagre.layout(layoutGraph, {disableOptimalOrderHeuristic: true});

            for (const task of tasks) {
                const {x, y} = layoutGraph.node(task.id.toString());

                task.pos = {
                    x: x - nodeWidth / 2,
                    y: y - task.elHeight / 2,
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
            width: nodeWidth,
            height: task.elHeight,
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
                    removeFromGraph(lastId, lastParentId);
                    addToGraph(task);
                }

                addToGraph(task);

            } else {
                removeFromGraph(task.id, task.parentId);
            }

            lastId = task.id;
            lastParentId = task.parentId;
        });
    });

    tasksSet.onDelTask(task => {
        removeFromGraph(task.id, task.parentId);
    });
    
        
    const flowNodes = $derived.by(() => {
        return tasks.values()
            .map(task => task.flowNode)
            .toArray();
    });

    const flowEdges = $derived.by(() => {
        return tasks.values()
            .map(task => task.flowEdge)
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