import type { Task } from "$api/client";
import Dagre from "@dagrejs/dagre";
import { type Edge, type Node } from "@xyflow/svelte";
import { tick, untrack } from "svelte";
import { SvelteMap, SvelteSet } from "svelte/reactivity";

export type ReactiveTask = {
    id: number,

    title: string,
    priority: number | null,
    parentId: number | null,
    hideChildren: boolean,
    alwaysExpanded: boolean,
    clear: boolean,
    trashed: boolean,
    hoursHistory: {
        created_at: Date,
        hr_completed: number,
        hr_remaining: number,
    }[],
    visible: boolean,
    pos: {
        x: number,
        y: number,
    },

    hrCompleted: number,
    hrRemaining: number,
    hrEstimateOriginal: number,

    elHeight: number,

    flowNode: Node<ReactiveTask>,
    flowEdge: Edge | null,
};

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


    const createReactiveTask = (baseTask: Task) => {
        let id = $state(baseTask.id);
        let title = $state(baseTask.title);
        let priority = $state(baseTask.priority);
        let parentId = $state(baseTask.parent_id);
        let hideChildren = $state(baseTask.hide_children);
        let alwaysExpanded = $state(baseTask.always_expanded);
        let clear = $state(baseTask.clear);
        let trashed = $state(baseTask.trashed);
        let hoursHistory = $state(baseTask.hoursHistory);
        let pos = $state.raw({x: 0, y: 0});

        const hrCompleted = $derived(
            (hoursHistory.at(-1)?.hr_completed ?? 0)
                + (
                    parentsToChildIds.get(id)?.values()
                        .map(childId => tasks.get(childId)?.hrCompleted ?? 0)
                        .reduce((a, b) => a + b, 0) 
                        ?? 0
                )
        );
        const hrRemaining = $derived(
            (hoursHistory.at(-1)?.hr_remaining ?? 0)
                + (
                    parentsToChildIds.get(id)?.values()
                        .map(childId => tasks.get(childId)?.hrRemaining ?? 0)
                        .reduce((a, b) => a + b, 0) 
                        ?? 0
                )
        );
        const hrEstimateOriginal = $derived(
            (hoursHistory[0].hr_completed + hoursHistory[0].hr_remaining)
                + (
                    parentsToChildIds.get(id)?.values()
                        .map(childId => tasks.get(childId)?.hrEstimateOriginal ?? 0)
                        .reduce((a, b) => a + b, 0) 
                        ?? 0
                )
        );
        
        let elHeight = $state(0);


        const visible = $derived.by(() => {
            if (clear || trashed) {
                return false;
            }

            if (parentId === null) {
                return true;
            }

            const parent = tasks.get(parentId);

            if (parent === undefined) {
                return true;
            }
            
            if (parent.hideChildren) {
                return false;
            }
            
            return parent.visible;
        });


        const reactiveTask = {
            get id() {
                return id;
            },
            set id(newId: number) {
                layoutGraph.removeNode(id.toString());

                id = newId;
            },

            get title() {
                return title;
            },
            set title(newTitle: string) {
                title = newTitle;
            },

            get priority() {
                return priority;
            },
            set priority(newPriority: number | null) {
                priority = newPriority;
            },

            get parentId() {
                return parentId;
            },
            set parentId(newParentId: number | null) {
                if (parentId === newParentId) return;

                unlinkFromParent(id, parentId);

                parentId = newParentId;

                linkToParent(id, parentId);

                updateNodePositions();
            },
            get hideChildren() {
                return hideChildren;
            },
            set hideChildren(newHideChildren: boolean) {
                hideChildren = newHideChildren;
            },
            alwaysExpanded,
            clear,

            get visible() {
                return visible;
            },

            get trashed() {
                return trashed;
            },
            set trashed(newTrashed: boolean) {
                trashed = newTrashed;
            },

            get pos() {
                return pos;
            },
            set pos(newPos: {x: number, y: number}) {
                pos = newPos;
            },

            hoursHistory,

            get hrCompleted() {
                return hrCompleted;
            },
            get hrRemaining() {
                return hrRemaining;
            },
            get hrEstimateOriginal() {
                return hrEstimateOriginal;
            },

            get elHeight() {
                return elHeight;
            },
            set elHeight(newElHeight: number) {
                if (elHeight === newElHeight) return;

                elHeight = newElHeight;
            },

            get flowNode() {
                return flowNode;
            },
            get flowEdge() {
                return flowEdge;
            },
        };


        const flowNode = $derived({
            id: id.toString(),
            type: "task",
            position: pos,
            data: reactiveTask,
        });

        const flowEdge = $derived.by(() => {
            if (parentId === null) return null;
            
            return {
                id: `e${parentId}-${id}`,
                type: "ancestry",
                source: parentId.toString(),
                target: id.toString(),
            };
        });


        $effect.root(() => {
            $effect(() => {
                if (visible) {
                    layoutGraph.setNode(id.toString(), {
                        width: nodeWidth,
                        height: elHeight,
                    });

                    if (parentId !== null) {
                        layoutGraph.setEdge(parentId.toString(), id.toString());
                    }

                    untrack(() => {
                        visibleTasks.add(reactiveTask);
                    });
                } else {
                    layoutGraph.removeNode(id.toString());

                    if (parentId !== null) {
                        layoutGraph.removeEdge(parentId.toString(), id.toString());
                    }

                    untrack(() => {
                        visibleTasks.delete(reactiveTask);
                    });
                }

                updateNodePositions();
            });

            return () => {};
        });


        return reactiveTask;
    };


    let relayoutQueued = false;
    const updateNodePositions = () => {
        if (relayoutQueued) return;

        relayoutQueued = true;

        tick().then(() => {
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
            const task = createReactiveTask(baseTask);
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