import type { Task } from "$api/client";
import { type Edge, type Node } from "@xyflow/svelte";
import { onDestroy, onMount, tick, untrack } from "svelte";
import { SvelteMap, SvelteSet } from "svelte/reactivity";
import { useEvent } from "./useEvent.svelte";


export class ReactiveTask {
    #tasks: Map<number, ReactiveTask>;
    #parentsToChildIds: Map<number, Set<number>>;

    id: number = $state(0);
    title: string = $state("");
    priority: number | null = $state(null);
    parentId: number | null = $state(null);
    hideChildren: boolean = $state(false);
    alwaysExpanded: boolean = $state(false);
    clear: boolean = $state(false);
    trashed: boolean = $state(false);
    hrCompleted: number = $state(0);
    hrRemaining: number = $state(0);
    hrEstimatedOrig: number = $state(0);

    pos: {
        x: number,
        y: number,
    } = $state.raw({x: 0, y: 0});

    hrCompletedTotal: number = $derived.by(() =>
        this.hrCompleted
            + (
                this.#parentsToChildIds.get(this.id)?.values()
                    .map(childId => this.#tasks.get(childId)?.hrCompletedTotal ?? 0)
                    .reduce((a, b) => a + b, 0) 
                    ?? 0
            )
    );
    hrRemainingTotal: number = $derived.by(() =>
        this.hrRemaining
            + (
                this.#parentsToChildIds.get(this.id)?.values()
                    .map(childId => this.#tasks.get(childId)?.hrRemainingTotal ?? 0)
                    .reduce((a, b) => a + b, 0) 
                    ?? 0
            )
    );
    hrEstimateTotalOriginal: number = $derived.by(() =>
        this.hrEstimatedOrig
            + (
                this.#parentsToChildIds.get(this.id)?.values()
                    .map(childId => this.#tasks.get(childId)?.hrEstimateTotalOriginal ?? 0)
                    .reduce((a, b) => a + b, 0) 
                    ?? 0
            )
    );

    done: boolean = $derived(this.hrCompletedTotal > 0 && this.hrRemainingTotal === 0);

    visible: boolean = $derived.by(() => {
        if (this.clear || this.trashed) {
            return false;
        }

        if (this.parentId === null) {
            return true;
        }

        const parent = this.#tasks.get(this.parentId);

        if (parent === undefined) {
            return true;
        }
        
        if (parent.hideChildren) {
            return false;
        }
        
        return parent.visible;
    });
    isParent: boolean = $derived.by(() => {
        const childIds = this.#parentsToChildIds.get(this.id);
        if (childIds === undefined) return false;

        return childIds.size > 0;
    });
    elHeight: number = $state(0);

    flowNode: Node<Record<string, any>> = $derived({
        id: this.id.toString(),
        type: "task",
        position: this.pos,
        data: this,
    });
    flowEdge: Edge | null = $derived.by(() => {
        if (this.parentId === null) return null;
        
        return {
            id: `e${this.parentId}-${this.id}`,
            type: "ancestry",
            source: this.parentId.toString(),
            target: this.id.toString(),
        };
    });


    constructor(baseTask: Task, {
        tasks,
        parentsToChildIds,
        unlinkFromParent,
        linkToParent,
    }: {
        tasks: Map<number, ReactiveTask>,
        parentsToChildIds: Map<number, Set<number>>,
        unlinkFromParent: (childId: number, parentId: number | null) => void,
        linkToParent: (childId: number, parentId: number | null) => void,
    }) {
        this.#tasks = tasks;
        this.#parentsToChildIds = parentsToChildIds;

        this.id = baseTask.id;
        this.title = baseTask.title;
        this.priority = baseTask.priority;
        this.parentId = baseTask.parent_id;
        this.hideChildren = baseTask.hide_children;
        this.alwaysExpanded = baseTask.always_expanded;
        this.clear = baseTask.clear;
        this.trashed = baseTask.trashed;
        this.hrCompleted = baseTask.hr_completed;
        this.hrRemaining = baseTask.hr_remaining;
        this.hrEstimatedOrig = baseTask.hr_estimated_orig;

        $effect.root(() => {
            let lastId: number | undefined = undefined;
            let lastParentId: number | null | undefined = undefined;
            $effect(() => {
                if (lastId === this.id && lastParentId === this.parentId) return;

                if (lastId !== undefined) {
                    tasks.delete(lastId);
                }

                if (lastParentId !== undefined && lastId !== undefined) {
                    unlinkFromParent(lastId, lastParentId);
                }

                tasks.set(this.id, this);
                linkToParent(this.id, this.parentId);

                lastId = this.id;
                lastParentId = this.parentId;
            });

            return () => {};
        });
    }
}

export const tasksContextKey = Symbol();

export const useTasks = () => {
    const tasks = $state(new SvelteMap<number, ReactiveTask>());
    const parentsToChildIds = $state(new SvelteMap<number, SvelteSet<number>>());


    const unlinkFromParent = (childId: number, parentId: number | null) => {
        if (parentId === null) return;

        const childIds = parentsToChildIds.get(parentId);
        if (childIds !== undefined) {
            childIds.delete(childId);
        }
    };

    const linkToParent = (childId: number, parentId: number | null) => {
        if (parentId === null) return;

        const childIds = parentsToChildIds.get(parentId);
        if (childIds !== undefined) {
            childIds.add(childId);
        } else {
            parentsToChildIds.set(parentId, new SvelteSet([childId]));
        }
    };
    

    const addTaskEvent = useEvent<[ReactiveTask]>(); 
    const delTaskEvent = useEvent<[ReactiveTask]>();

    return {
        addTask: (baseTask: Task) => {
            const task = new ReactiveTask(baseTask, {
                tasks,
                parentsToChildIds,
                unlinkFromParent,
                linkToParent,
            });
            tasks.set(task.id, task);
            linkToParent(task.id, task.parentId);

            addTaskEvent.emit(task);

            return task;
        },

        getTask: (id: number) => tasks.get(id),

        delTask: (task: ReactiveTask) => {
            unlinkFromParent(task.id, task.parentId);
            tasks.delete(task.id);
            parentsToChildIds.delete(task.id);

            delTaskEvent.emit(task);
        },

        onAddTask: (handler: (task: ReactiveTask) => void) => {
            addTaskEvent.on(handler);
        },

        onDelTask: (handler: (task: ReactiveTask) => void) => {
            delTaskEvent.on(handler);
        },

        taskEffect: (handler: (task: ReactiveTask) => void) => {
            for (const task of tasks.values()) {
                handler(task);
            }

            addTaskEvent.on(task => {
                $effect.root(() => {
                    handler(task);

                    return () => {};
                });
            });
        },

        tasks() {
            return tasks.values();
        },
    };
};