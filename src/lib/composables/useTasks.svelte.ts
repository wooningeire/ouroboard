import type { Task } from "$api/client";
import Dagre, { graphlib } from "@dagrejs/dagre";
import { type Edge, type Node } from "@xyflow/svelte";
import { tick, untrack } from "svelte";
import { SvelteMap, SvelteSet } from "svelte/reactivity";


export class ReactiveTask {
    id: number;
    title: string;
    priority: number | null;
    parentId: number | null;
    hideChildren: boolean;
    alwaysExpanded: boolean;
    clear: boolean;
    trashed: boolean;
    hoursHistory: {
        created_at: Date,
        hr_completed: number,
        hr_remaining: number,
    }[];

    pos: {
        x: number,
        y: number,
    };

    hrCompleted: number;
    hrRemaining: number;
    hrEstimateOriginal: number;

    visible: boolean;
    elHeight: number;

    flowNode: Node<Record<string, any>>;
    flowEdge: Edge | null;


    constructor(baseTask: Task, {
        tasks,
        parentsToChildIds,
        layoutGraph,
        nodeWidth,
        updateNodePositions,
        unlinkFromParent,
        visibleTasks,
    }: {
        tasks: Map<number, ReactiveTask>,
        parentsToChildIds: Map<number, Set<number>>,
        layoutGraph: graphlib.Graph,
        nodeWidth: number,
        updateNodePositions: () => void,
        unlinkFromParent: (childId: number, parentId: number | null) => void,
        visibleTasks: Set<ReactiveTask>,
    }) {
        this.id = $state(baseTask.id);
        this.title = $state(baseTask.title);
        this.priority = $state(baseTask.priority);
        this.parentId = $state(baseTask.parent_id);
        this.hideChildren = $state(baseTask.hide_children);
        this.alwaysExpanded = $state(baseTask.always_expanded);
        this.clear = $state(baseTask.clear);
        this.trashed = $state(baseTask.trashed);
        this.hoursHistory = $state(baseTask.hoursHistory);
        this.pos = $state.raw({x: 0, y: 0});

        this.hrCompleted = $derived(
            (this.hoursHistory.at(-1)?.hr_completed ?? 0)
                + (
                    parentsToChildIds.get(this.id)?.values()
                        .map(childId => tasks.get(childId)?.hrCompleted ?? 0)
                        .reduce((a, b) => a + b, 0) 
                        ?? 0
                )
        );
        this.hrRemaining = $derived(
            (this.hoursHistory.at(-1)?.hr_remaining ?? 0)
                + (
                    parentsToChildIds.get(this.id)?.values()
                        .map(childId => tasks.get(childId)?.hrRemaining ?? 0)
                        .reduce((a, b) => a + b, 0) 
                        ?? 0
                )
        );
        this.hrEstimateOriginal = $derived(
            (this.hoursHistory[0].hr_completed + this.hoursHistory[0].hr_remaining)
                + (
                    parentsToChildIds.get(this.id)?.values()
                        .map(childId => tasks.get(childId)?.hrEstimateOriginal ?? 0)
                        .reduce((a, b) => a + b, 0) 
                        ?? 0
                )
        );
        
        this.elHeight = $state(0);


        this.visible = $derived.by(() => {
            if (this.clear || this.trashed) {
                return false;
            }

            if (this.parentId === null) {
                return true;
            }

            const parent = tasks.get(this.parentId);

            if (parent === undefined) {
                return true;
            }
            
            if (parent.hideChildren) {
                return false;
            }
            
            return parent.visible;
        });

        this.flowNode = $derived({
            id: this.id.toString(),
            type: "task",
            position: this.pos,
            data: this,
        });

        this.flowEdge = $derived.by(() => {
            if (this.parentId === null) return null;
            
            return {
                id: `e${this.parentId}-${this.id}`,
                type: "ancestry",
                source: this.parentId.toString(),
                target: this.id.toString(),
            };
        });


        $effect.root(() => {
            let lastId: number | undefined = undefined;
            let lastParentId: number | null | undefined = undefined;
            $effect(() => {
                if (lastId !== undefined && lastId !== this.id) {
                    layoutGraph.removeNode(lastId.toString());
                }

                if (lastParentId !== undefined && lastId !== undefined && (lastId !== this.id || lastParentId !== this.parentId)) {
                    unlinkFromParent(lastId, lastParentId);
                }

                lastId = this.id;
                lastParentId = this.parentId;
            });

            $effect(() => {
                if (this.visible) {
                    layoutGraph.setNode(this.id.toString(), {
                        width: nodeWidth,
                        height: this.elHeight,
                    });

                    if (this.parentId !== null) {
                        layoutGraph.setEdge(this.parentId.toString(), this.id.toString());
                    }

                    untrack(() => {
                        visibleTasks.add(this);
                    });
                } else {
                    layoutGraph.removeNode(this.id.toString());

                    if (this.parentId !== null) {
                        layoutGraph.removeEdge(this.parentId.toString(), this.id.toString());
                    }

                    untrack(() => {
                        visibleTasks.delete(this);
                    });
                }

                updateNodePositions();
            });

            return () => {};
        });
    }
}

export const tasksContextKey = Symbol();

export const useTasks = () => {
    const tasks = $state(new SvelteMap<number, ReactiveTask>());
    const parentsToChildIds = $state(new SvelteMap<number, SvelteSet<number>>());

    const visibleTasks = $state(new SvelteSet<ReactiveTask>());

    $effect(() => {
        void visibleTasks;

        updateNodePositions();
    });


    const nodeWidth = 600;
    const layoutGraph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    layoutGraph.setGraph({ rankdir: "LR", align: "UL", nodesep: 10 });


    let relayoutQueued = false;
    const updateNodePositions = () => {
        if (relayoutQueued) return;

        relayoutQueued = true;

        requestAnimationFrame(() => {
            Dagre.layout(layoutGraph);

            for (const task of visibleTasks) {
                const {x, y} = layoutGraph.node(task.id.toString());

                task.pos = {
                    x: x - nodeWidth / 2,
                    y: y - task.elHeight / 2,
                };
            }

            relayoutQueued = false;
        });
    };


    const unlinkFromParent = (childId: number, parentId: number | null) => {
        if (parentId === null) return;

        const childIds = parentsToChildIds.get(parentId);
        if (childIds !== undefined) {
            childIds.delete(childId);
        }

        layoutGraph.removeEdge(parentId.toString(), childId.toString());
    };

    const linkToParent = (childId: number, parentId: number | null) => {
        if (parentId === null) return;

        const childIds = parentsToChildIds.get(parentId);
        if (childIds !== undefined) {
            childIds.add(childId);
        } else {
            parentsToChildIds.set(parentId, new SvelteSet([childId]));
        }

        layoutGraph.setEdge(parentId.toString(), childId.toString());
    };

    const flowNodes = $derived.by(() => {
        return visibleTasks.values()
            .map(task => task.flowNode)
            .toArray();
    });

    const flowEdges = $derived.by(() => {
        return visibleTasks.values()
            .map(task => task.flowEdge)
            .filter(edge => edge !== null)
            .toArray();
    });

    return {
        addTask: (baseTask: Task) => {
            const task = new ReactiveTask(baseTask, {
                tasks,
                parentsToChildIds,
                layoutGraph,
                nodeWidth,
                updateNodePositions,
                unlinkFromParent,
                visibleTasks,
            });
            tasks.set(task.id, task);
            linkToParent(task.id, task.parentId);

            return task;
        },

        getTask: (id: number) => tasks.get(id),

        delTask: (task: ReactiveTask) => {
            unlinkFromParent(task.id, task.parentId);
            tasks.delete(task.id);
            parentsToChildIds.delete(task.id);
            layoutGraph.removeNode(task.id.toString());
            visibleTasks.delete(task);

            updateNodePositions();
        },

        get flowNodes() {
            return flowNodes;
        },
        get flowEdges() {
            return flowEdges;
        },
    };
};