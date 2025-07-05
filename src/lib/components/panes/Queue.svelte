<script lang="ts" module>
import { crossfade } from "svelte/transition";
    import { cubicInOut } from "svelte/easing";
const [send, receive] = crossfade({easing: cubicInOut});
</script>

<script lang="ts">
import { ReactiveTask, tasksContextKey, useTasks } from "$lib/composables/useTasks.svelte";
    import Priority from "@/parts/Priority.svelte";
    import TaskCard from "@/parts/TaskCard.svelte";
    import { getContext } from "svelte";
    import { SvelteMap, SvelteSet } from "svelte/reactivity";
    import { flip } from "svelte/animate";


let showDone = $state(false);
let showParents = $state(false);

const tasksSet = getContext<ReturnType<typeof useTasks>>(tasksContextKey);

const priorities = [null, 0, 1, 2, 3, 4, 5];

const tasksByPriority = $state(new SvelteMap<number | null, Set<ReactiveTask>>(
    priorities.map(priority => [priority, new SvelteSet()])
));


const listenToTaskPriority = (task: ReactiveTask) => {
    let lastPriority: number | null | undefined = undefined;
    $effect(() => {
        const passesFilters = (showDone || !task.done) && (showParents || !task.isParent)
        if (!task.visible || !passesFilters) {
            tasksByPriority.get(task.priority)?.delete(task);
            return;
        }

        if (lastPriority !== undefined && lastPriority !== task.priority) {
            tasksByPriority.get(lastPriority)?.delete(task);
        }

        tasksByPriority.get(task.priority)?.add(task);

        lastPriority = task.priority;
    });
};

tasksSet.taskEffect(listenToTaskPriority);
tasksSet.onDelTask(task => {
    tasksByPriority.get(task.priority)?.delete(task);
});


</script>

<queue-page>
    <options-rack>
        <options-rack-option>
            <input
                type="checkbox"
                bind:checked={showDone}
            />
            Done tasks
        </options-rack-option>

        <options-rack-option>
            <input
                type="checkbox"
                bind:checked={showParents}
            />
            Parent tasks
        </options-rack-option>
    </options-rack>

    <task-priorities>
        {#each tasksByPriority as [priority, tasks], i (priority)}
            <task-priority-set>
                <Priority value={priority} />

                <task-list>
                    {#each tasks as task (task.id)}
                        <task-card-animator
                            in:receive={{key: task.id}}
                            out:send={{key: task.id}}
                            animate:flip
                        >
                            <TaskCard
                                {task}
                                constrainMaxWidth
                            />
                        </task-card-animator>
                    {/each}
                </task-list>
            </task-priority-set>

            {#if i < tasksByPriority.size - 1}

            <task-priority-divider></task-priority-divider>
            {/if}
        {/each}
    </task-priorities>

    <task-calendar>

    </task-calendar>
</queue-page>

<style lang="scss">
queue-page {
    display: flex;
    flex-direction: column;
}

task-priorities {
    display: flex;
    align-items: stretch;
    flex-wrap: nowrap;
    overflow-y: auto;

    > * {
        flex-shrink: 0;
    }
}

task-priority-set {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    width: 20rem;
    padding: 0 0.5rem;

    border-radius: 0.5rem;
}

task-list {
    display: flex;
    gap: 0.5rem;
    flex-direction: column;
    flex-grow: 1;
    overflow-y: auto;
}

task-priority-divider {
    display: block;
    width: 1px;
    background: oklch(0.95 0 0);
}

task-card-animator {
    display: block;
}
</style>