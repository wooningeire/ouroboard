import Dagre from "@dagrejs/dagre";
import type { TasksSet } from "./TasksSet.svelte";
import { SvelteMap } from "svelte/reactivity";
import type { Task } from "./Task.svelte";
import { GraphTask } from "./GraphTask.svelte";
import { untrack } from "svelte";



export class TasksGraphLayout {
    readonly #graphTasks = $state(new SvelteMap<Task, GraphTask>());
    
    readonly flowNodes = $derived.by(() => {
        return this.#graphTasks.entries()
            .filter(([task, graphTask]) => task.visible)
            .map(([task, graphTask]) => graphTask.flowNode)
            .toArray();
    });

    readonly flowEdges = $derived.by(() => {
        return this.#graphTasks.entries()
            .filter(([task, graphTask]) => task.visible)
            .map(([task, graphTask]) => graphTask.flowEdge)
            .filter(edge => edge !== null)
            .toArray();
    });

    constructor ({
        filterTask,
        tasksSet,
    }: {
        filterTask: (task: Task) => boolean,
        tasksSet: TasksSet,
    }) {
        const width = 600;
        $effect.root(() => {
            $effect(() => {
                const layoutGraph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
                layoutGraph.setGraph({ rankdir: "LR", align: "UL", nodesep: 5 });

                for (const [task, graphTask] of this.#graphTasks.entries()) {
                    layoutGraph.setNode(task.id.toString(), {
                        width: width,
                        height: graphTask.elDimensions.height,
                    });

                    if (task.parentId !== null) {
                        layoutGraph.setEdge(task.parentId.toString(), task.id.toString());
                    }
                }

                Dagre.layout(layoutGraph, {disableOptimalOrderHeuristic: true});

                for (const [task, graphTask] of this.#graphTasks.entries()) {
                    const {x, y} = layoutGraph.node(task.id.toString())!;

                    task.pos = {
                        x: x - width / 2,
                        y: y - graphTask.elDimensions.height / 2,
                    };
                }
            });
        });

        tasksSet.taskEffect(task => {
            $effect(() => {
                if (task.visible && filterTask(task)) {
                    untrack(() => this.#graphTasks.set(task, new GraphTask(task)));
                } else {
                    untrack(() => this.#graphTasks.delete(task));
                }
            });
        });

        tasksSet.onDel(task => {
            this.#graphTasks.delete(task);
        });
    }

};