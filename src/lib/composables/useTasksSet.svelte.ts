import type { ApiTask } from "$api/client";
import { SvelteMap, SvelteSet } from "svelte/reactivity";
import { useEvent } from "./useEvent.svelte";
import { Task } from "./Task.svelte";



export const tasksContextKey = Symbol();

export const useTasksSet = () => {
    const tasks = $state(new SvelteMap<number, Task>());
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
    

    const addTaskEvent = useEvent<[Task]>(); 
    const delTaskEvent = useEvent<[Task]>();

    return {
        addTask: (baseTask: ApiTask) => {
            const task = new Task(baseTask, {
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

        delTask: (task: Task) => {
            unlinkFromParent(task.id, task.parentId);
            tasks.delete(task.id);
            parentsToChildIds.delete(task.id);

            delTaskEvent.emit(task);
        },

        onAddTask: (handler: (task: Task) => void) => {
            addTaskEvent.on(handler);
        },

        onDelTask: (handler: (task: Task) => void) => {
            delTaskEvent.on(handler);
        },

        taskEffect: (handler: (task: Task) => void) => {
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