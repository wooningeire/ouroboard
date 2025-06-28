import type { Task } from "$api/client";
import Dagre, { layout } from "@dagrejs/dagre";
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

    hrCompleted: number,
    hrRemaining: number,
    hrEstimateOriginal: number,
    pos: ReturnType<typeof usePos>,

    elHeight: number,
};


export const useTasks = () => {
    const tasks = $state(new SvelteMap<number, ReactiveTask>());
    const parentsToChildIds = $state(new SvelteMap<number, SvelteSet<number>>());


    const nodeWidth = 500;
    const layoutGraph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    layoutGraph.setGraph({ rankdir: "LR" });

    
    const visibleTasks = $derived.by(() => {
        const hasInvisibleAncestorResults = new Map<number, boolean>();

        const hasInvisibleAncestor = (task: ReactiveTask): boolean => {
            const savedResult = hasInvisibleAncestorResults.get(task.id);
            if (savedResult !== undefined) {
                return savedResult;
            }


            let result: boolean;

            if (task.parentId === null) {
                result = false;
            } else if (task.clear || task.trashed) {
                result = true;
            } else {
                const parent = tasks.get(task.parentId);

                if (parent === undefined) {
                    result = true;
                } else if (parent.hideChildren) {
                    result = true;
                } else {
                    result = hasInvisibleAncestor(parent);
                }
            }
            
            hasInvisibleAncestorResults.set(task.id, result);
            return result;
        };


        return new Map(
            tasks.values()
                .filter(task => !hasInvisibleAncestor(task))
                .map(task => [task.id, task])
        );
    });

    $effect(() => {
        void visibleTasks;

        updateNodePositions();
    });


    const {nodeEase, startPosAnimation} = useTaskAnimation();


    const createReactiveTask = (task: Task) => {
        let id = $state(task.id);
        let title = $state(task.title);
        let priority = $state(task.priority);
        let parentId = $state(task.parent_id);
        let hideChildren = $state(task.hide_children);
        let alwaysExpanded = $state(task.always_expanded);
        let clear = $state(task.clear);
        let trashed = $state(task.trashed);
        let hoursHistory = $state(task.hoursHistory);

        const hrCompleted = $derived(
            (task.hoursHistory.at(-1)?.hr_completed ?? 0)
                + (
                    parentsToChildIds.get(task.id)?.values()
                        .map(childId => tasks.get(childId)?.hrCompleted ?? 0)
                        .reduce((a, b) => a + b, 0) 
                        ?? 0
                )
        );
        const hrRemaining = $derived(
            (task.hoursHistory.at(-1)?.hr_remaining ?? 0)
                + (
                    parentsToChildIds.get(task.id)?.values()
                        .map(childId => tasks.get(childId)?.hrRemaining ?? 0)
                        .reduce((a, b) => a + b, 0) 
                        ?? 0
                )
        );
        const hrEstimateOriginal = $derived(
            (task.hoursHistory[0].hr_completed + task.hoursHistory[0].hr_remaining)
                + (
                    parentsToChildIds.get(task.id)?.values()
                        .map(childId => tasks.get(childId)?.hrEstimateOriginal ?? 0)
                        .reduce((a, b) => a + b, 0) 
                        ?? 0
                )
        );
        
        const pos = usePos({ x: 0, y: 0 }, nodeEase);

        let elHeight = $state(0);


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

            get trashed() {
                return trashed;
            },
            set trashed(newTrashed: boolean) {
                trashed = newTrashed;
            },

            hoursHistory,

            hrCompleted,
            hrRemaining,
            hrEstimateOriginal,
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
                    if (!visibleTasks.has(childId) || !visibleTasks.has(parentId)) {
                        layoutGraph.removeEdge(parentId.toString(), childId.toString());
                    } else {
                        layoutGraph.setEdge(parentId.toString(), childId.toString());
                    }
                }
            }

            for (const task of tasks.values()) {
                if (!visibleTasks.has(task.id)) {
                    layoutGraph.removeNode(task.id.toString());
                } else {
                    layoutGraph.setNode(task.id.toString(), {
                        width: nodeWidth,
                        height: task.elHeight,
                    });
                }
            }


            Dagre.layout(layoutGraph);

            for (const task of visibleTasks.values()) {
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


const useTaskAnimation = () => {
    let nodePosAnimStartTime = Date.now();
    let nodePosAnimProgress = $state(1);
    const nodeEase = $derived(1 - (1 - nodePosAnimProgress)**3);
    let handle = 0;

    const animate = () => {
        nodePosAnimProgress = Math.min((Date.now() - nodePosAnimStartTime) / 500, 1);
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
