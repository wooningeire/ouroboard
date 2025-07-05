import { SvelteSet } from "svelte/reactivity";
import type { ReactiveTask, useTasks } from "./useTasks.svelte"
import { useEvent } from "./useEvent.svelte";

export const useTasksSorter = ({
    tasksSet,
    filterTask,
    mapTaskToBucket,
}: {
    tasksSet: ReturnType<typeof useTasks>,
    filterTask: (task: ReactiveTask) => boolean,
    mapTaskToBucket: (task: ReactiveTask) => Set<ReactiveTask> | null,
}) => {
    const oldBuckets = new Map<ReactiveTask, Set<ReactiveTask>>();

    tasksSet.taskEffect(task => {
        $effect(() => {
            const oldBucket = oldBuckets.get(task) ?? null;
            if (!task.visible || !filterTask(task)) {
                oldBucket?.delete(task);
                oldBuckets.delete(task);

                bucketChangeEvent.emit(task, oldBucket, null);
                return;
            }

            const newBucket = mapTaskToBucket(task);
            if (oldBucket === newBucket) return;


            oldBucket?.delete(task);
            newBucket?.add(task);

            bucketChangeEvent.emit(task, oldBucket, newBucket);

            if (newBucket === null) {
                oldBuckets.delete(task);
            } else {
                oldBuckets.set(task, newBucket);
            }
        });
    });

    tasksSet.onDelTask(task => {
        const oldBucket = oldBuckets.get(task) ?? null;
        oldBucket?.delete(task);

        bucketChangeEvent.emit(task, oldBucket, null);
    });

    
    const bucketChangeEvent = useEvent<[ReactiveTask, Set<ReactiveTask> | null, Set<ReactiveTask> | null]>();

    return {
        onBucketChange: (handler: (task: ReactiveTask, oldBucket: Set<ReactiveTask> | null, newBucket: Set<ReactiveTask> | null) => void) => {
            bucketChangeEvent.on(handler);
        },
    };
};