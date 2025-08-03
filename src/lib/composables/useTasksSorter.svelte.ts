import {type Task} from "./Task.svelte";
import {TasksSet} from "./TasksSet.svelte"
import { useEvent } from "./useEvent.svelte";

export const useTasksSorter = ({
    tasksSet,
    filterTask,
    mapTaskToBucket,
}: {
    tasksSet: TasksSet,
    filterTask: (task: Task) => boolean,
    mapTaskToBucket: (task: Task) => Set<Task> | null,
}) => {
    const oldBuckets = new Map<Task, Set<Task>>();

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

    tasksSet.onDel(task => {
        const oldBucket = oldBuckets.get(task) ?? null;
        oldBucket?.delete(task);

        bucketChangeEvent.emit(task, oldBucket, null);
    });

    
    const bucketChangeEvent = useEvent<[Task, Set<Task> | null, Set<Task> | null]>();

    return {
        onBucketChange: (handler: (task: Task, oldBucket: Set<Task> | null, newBucket: Set<Task> | null) => void) => {
            bucketChangeEvent.on(handler);
        },
    };
};