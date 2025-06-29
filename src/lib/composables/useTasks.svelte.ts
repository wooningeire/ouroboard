import type { Task } from "$api/client";
import Dagre from "@dagrejs/dagre";
import { tick } from "svelte";
import { SvelteMap, SvelteSet } from "svelte/reactivity";

type Position = { x: number; y: number };


export const usePos = (newTarget: Position, nodeEase: () => number) => {
    let last = $state(newTarget);
    let target = $state(newTarget);
    const current = $derived.by(() => {
        if (nodeEase() === 1) {
            return target;
        }
        
        return {
            x: last.x + (target.x - last.x) * nodeEase(),
            y: last.y + (target.y - last.y) * nodeEase(),
        };
    });

    let isFirst = true;

    return {
        get last() {
            return last;
        },
        get target() {
            return target;
        },
        get current() {
            return current;
        },
        setTarget: (newTarget: Position) => {
            if (isFirst) {
                last = newTarget;
                target = newTarget;

                isFirst = false;
            } else {
                last = current;
                target = newTarget;
            }
        },

        doNotAnimateNextChange() {
            isFirst = true;
        },
    };
};


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

    hrCompleted: number,
    hrRemaining: number,
    hrEstimateOriginal: number,
    pos: ReturnType<typeof usePos>,

    elHeight: number,
};

export const tasksContextKey = Symbol();

export const useTasks = () => {
    const tasks = $state(new SvelteMap<number, ReactiveTask>());
    const parentsToChildIds = $state(new SvelteMap<number, SvelteSet<number>>());


    // const visibleTasks = new Set<ReactiveTask>();


    const visibleTasks = $derived(
        tasks.values()
            .filter(task => task.visible)
            .toArray()
    );

    $effect(() => {
        void visibleTasks;

        updateNodePositions();
    });


    const nodeWidth = 600;
    const layoutGraph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    layoutGraph.setGraph({ rankdir: "LR", align: "UL", nodesep: 10 });


    const {nodeEase, startPosAnimation} = useTaskAnimation();


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
        
        const pos = usePos({ x: 0, y: 0 }, nodeEase);

        let elHeight = $state(0);


        const visible = $derived.by(() => {
            if (parentId === null) {
                return true;
            }

            if (clear || trashed) {
                return false;
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


        return {
            get id() {
                return id;
            },
            set id(newId: number) {
                layoutGraph.removeNode(id.toString());

                id = newId;

                layoutGraph.setNode(id.toString(), {
                    width: nodeWidth,
                    height: elHeight,
                });
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
            pos,

            get elHeight() {
                return elHeight;
            },
            set elHeight(newElHeight: number) {
                if (elHeight === newElHeight) return;

                elHeight = newElHeight;
                
                layoutGraph.setNode(id.toString(), {
                    width: nodeWidth,
                    height: elHeight,
                });

                updateNodePositions();
            },
        };
    };


    let relayoutQueued = false;
    const updateNodePositions = () => {
        if (relayoutQueued) return;

        relayoutQueued = true;

        tick().then(() => {
            for (const [parentId, childIds] of parentsToChildIds) {
                for (const childId of childIds.values()) {
                    if (!tasks.get(childId)!.visible || !tasks.get(parentId)!.visible) {
                        layoutGraph.removeEdge(parentId.toString(), childId.toString());
                    } else {
                        layoutGraph.setEdge(parentId.toString(), childId.toString());
                    }
                }
            }

            const visibleTasks: ReactiveTask[] = [];

            for (const task of tasks.values()) {
                if (!task.visible) {
                    layoutGraph.removeNode(task.id.toString());

                    task.pos.doNotAnimateNextChange();
                } else {
                    layoutGraph.setNode(task.id.toString(), {
                        width: nodeWidth,
                        height: task.elHeight,
                    });

                    visibleTasks.push(task);
                }
            }


            Dagre.layout(layoutGraph);

            for (const task of visibleTasks) {
                const {x, y} = layoutGraph.node(task.id.toString());

                task.pos.setTarget({
                    x: x - nodeWidth / 2,
                    y: y - task.elHeight / 2,
                });
            }

            startPosAnimation();

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
            .map(task => {
                return {
                    id: task.id.toString(),
                    type: "task",
                    position: task.pos.current,
                    data: task,
                };
            })
            .toArray();
    });

    const flowEdges = $derived.by(() => {
        return visibleTasks.values()
            .flatMap(task => {
                const parentId = task.id;
                const childIds = parentsToChildIds.get(parentId);
                if (childIds === undefined) return [];


                return childIds.values()
                    .map(childId => ({
                        id: `e${parentId}-${childId}`,
                        type: "ancestry",
                        source: parentId.toString(),
                        target: childId.toString(),
                    }))
            })
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


const useTaskAnimation = ({
    duration = 250,
}: {
    duration?: number,
}={}) => {
    let nodePosAnimStartTime = Date.now();
    let nodePosAnimProgress = $state(1);
    const nodeEase = $derived(1 - (1 - nodePosAnimProgress)**3);
    let handle = 0;

    const animate = () => {
        nodePosAnimProgress = Math.min((Date.now() - nodePosAnimStartTime) / duration, 1);
        if (nodePosAnimProgress >= 1) return;
        
        handle = requestAnimationFrame(animate);
    };

    const startPosAnimation = () => {
        cancelAnimationFrame(handle);
        nodePosAnimStartTime = Date.now();

        nodePosAnimProgress = 0;
        handle = requestAnimationFrame(animate);
    };

    return {
        nodeEase: () => nodeEase,
        startPosAnimation,
    };
};
