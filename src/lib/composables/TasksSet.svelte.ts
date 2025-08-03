import type { ApiTask } from "$api/client";
import { SvelteMap, SvelteSet } from "svelte/reactivity";
import { useEvent } from "./useEvent.svelte";
import { Task } from "./Task.svelte";
import { EventMap } from "./EventMap.svelte";

export class TasksSet {
    readonly #tasks = new EventMap<number, Task>();
    readonly #parentsToChildIds = new EventMap<number, SvelteSet<number>>();

    onAdd(fn: (task: Task) => void) {
        this.#tasks.onAdd((_, task) => fn(task));
    }

    onDel(fn: (task: Task) => void) {
        this.#tasks.onDelete((_, task) => fn(task));
    }

    #unlinkFromParent(childId: number, parentId: number | null) {
        if (parentId === null) return;

        const childIds = this.#parentsToChildIds.get(parentId);
        if (childIds !== undefined) {
            childIds.delete(childId);
        }
    }

    #linkToParent(childId: number, parentId: number | null) {
        if (parentId === null) return;

        const childIds = this.#parentsToChildIds.get(parentId);
        if (childIds !== undefined) {
            childIds.add(childId);
        } else {
            this.#parentsToChildIds.set(parentId, new SvelteSet([childId]));
        }
    }

    addTask(baseTask: ApiTask): Task {        
        const task = new Task(baseTask, {
            tasks: this.#tasks.items,
            parentsToChildIds: this.#parentsToChildIds.items,
            unlinkFromParent: (childId, parentId) => this.#unlinkFromParent(childId, parentId),
            linkToParent: (childId, parentId) => this.#linkToParent(childId, parentId),
        });

        this.#tasks.set(task.id, task);
        this.#linkToParent(task.id, task.parentId);

        return task;
    }

    getTask(id: number) {
        return this.#tasks.get(id);
    }

    delTask(task: Task) {
        this.#unlinkFromParent(task.id, task.parentId);
        this.#tasks.delete(task.id);
        this.#parentsToChildIds.delete(task.id);
    }

    taskEffect(fn: (task: Task) => void) {
        for (const task of this.values()) {
            fn(task);
        }

        this.onAdd(task => {
            $effect.root(() => {
                fn(task);

                return () => {};
            });
        });
    }

    values() {
        return this.#tasks.values();
    }
}