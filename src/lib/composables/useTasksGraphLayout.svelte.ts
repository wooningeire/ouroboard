import Dagre, { graphlib } from "@dagrejs/dagre";
import type { TasksSet } from "./TasksSet.svelte";
import { SvelteMap } from "svelte/reactivity";
import type { Edge, Node, NodeTypes } from "@xyflow/svelte";
import { untrack } from "svelte";
import type { Task } from "./Task.svelte";


export class GraphTask {
    task: Task = $state()!;

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

    constructor(task: Task) {
        this.task = task;
    }
}

export const useTasksGraphLayout = ({
    tasksSet,
}: {
    tasksSet: TasksSet,
}) => {
    const graphTasks = $state(new SvelteMap<Task, GraphTask>());

    const width = 600;
    $effect.root(() => {
        $effect(() => {
            const layoutGraph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
            layoutGraph.setGraph({ rankdir: "LR", align: "UL", nodesep: 5 });

            for (const [task, graphTask] of graphTasks.entries()) {
                if (!task.visible) continue;

                layoutGraph.setNode(task.id.toString(), {
                    width: width,
                    height: graphTask.elDimensions.height,
                });

                if (task.parentId !== null) {
                    layoutGraph.setEdge(task.parentId.toString(), task.id.toString());
                }
            }

            Dagre.layout(layoutGraph, {disableOptimalOrderHeuristic: true});

            for (const [task, graphTask] of graphTasks.entries()) {
                if (!task.visible) continue;
                
                const {x, y} = layoutGraph.node(task.id.toString())!;

                task.pos = {
                    x: x - width / 2,
                    y: y - graphTask.elDimensions.height / 2,
                };
            }
        });
    });

    tasksSet.taskEffect(task => {
        graphTasks.set(task, new GraphTask(task));
    });

    tasksSet.onDel(task => {
        graphTasks.delete(task);
    });
    
        
    const flowNodes = $derived.by(() => {
        return graphTasks.entries()
            .filter(([task, graphTask]) => task.visible)
            .map(([task, graphTask]) => graphTask.flowNode)
            .toArray();
    });

    const flowEdges = $derived.by(() => {
        return graphTasks.entries()
            .filter(([task, graphTask]) => task.visible)
            .map(([task, graphTask]) => graphTask.flowEdge)
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