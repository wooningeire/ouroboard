<script lang="ts" module>
import { crossfade } from "svelte/transition";
    import { cubicInOut } from "svelte/easing";
const [send, receive] = crossfade({easing: cubicInOut});
</script>

<script lang="ts">
import { tasksContextKey, useTasksSet } from "$lib/composables/useTasksSet.svelte";
import Priority from "@/parts/Priority.svelte";
import TaskCard from "@/parts/TaskCard.svelte";
import { getContext } from "svelte";
import { SvelteMap, SvelteSet } from "svelte/reactivity";
import { flip } from "svelte/animate";
import { useTasksSorter } from "$lib/composables/useTasksSorter.svelte";
import PaneLabel from "@/parts/PaneLabel.svelte";
import type { Task } from "$lib/composables/Task.svelte";


let showDone = $state(false);
let showParents = $state(false);

const tasksSet = getContext<ReturnType<typeof useTasksSet>>(tasksContextKey);

const priorities = [null, 0, 1, 2, 3, 4, 5];

const tasksByPriority = $state(new SvelteMap<number | null, Set<Task>>(
    priorities.map(priority => [priority, new SvelteSet()])
));

const setWidths = $state(new SvelteMap<number | null, number | null>(
    priorities.map(priority => [priority, null])
));

const prioritySetWidth = (priority: number | null) => {
    const width = setWidths.get(priority);
    if (width === null || width === undefined) return "auto";
    
    return `${width}px`;
}

const selectedTasks = $state(new SvelteSet<Task>());

useTasksSorter({
    tasksSet,
    filterTask: task => ((showDone || !task.done) && (showParents || !task.isParent)) || selectedTasks.has(task),
    mapTaskToBucket: task => tasksByPriority.get(task.priority) ?? null,
});
</script>

<queue-page>
    <PaneLabel title="priority board">
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
    </PaneLabel>

    <task-priorities>
        {#each tasksByPriority as [priority, tasks], i (priority)}
            <task-priority-set
                class:empty={tasks.size === 0}
                style:--content-width={prioritySetWidth(priority)}
            >
                <task-priority-set-content
                    bind:offsetWidth={null, value => setWidths.set(priority, value!)}
                >
                    <Priority value={priority} />

                    <task-list>
                        {#each tasks as task (task.id)}
                            <task-card-animator
                                in:receive={{key: task.id}}
                                out:send={{key: task.id}}
                                animate:flip={{duration: 250, easing: cubicInOut}}
                            >
                                <TaskCard
                                    {task}
                                    constrainMaxWidth
                                    displayAncestorTitles
                                    showChildToggle={showParents}
                                    onSelectedChange={selected => {
                                        if (selected) {
                                            selectedTasks.add(task);
                                        } else {
                                            selectedTasks.delete(task);
                                        }
                                    }}
                                />
                            </task-card-animator>
                        {/each}
                    </task-list>
                </task-priority-set-content>
            </task-priority-set>

            {#if i < tasksByPriority.size - 1}

            <task-priority-divider></task-priority-divider>
            {/if}
        {/each}
    </task-priorities>
</queue-page>

<style lang="scss">
queue-page {
    min-width: 0;
    min-height: 0;

    display: flex;
    flex-direction: column;
    align-items: stretch;
}

task-priorities {
    height: 0;
    flex-grow: 1;

    padding-top: 0.5rem;

    display: flex;
    align-items: stretch;
    flex-wrap: nowrap;
    overflow-x: auto;

    > * {
        flex-shrink: 0;
    }
}

task-priority-set {
    flex-grow: 1;

    display: flex;
    flex-direction: column;
    width: 20rem;
    padding: 0 0.5rem;

    border-radius: 0.5rem;

    transition:
        opacity 0.375s cubic-bezier(0.5,0,0,1),
        width 0.375s cubic-bezier(0.5,0,0,1);

    --content-width: auto;
    &.empty {
        flex-grow: 0;
        width: calc(var(--content-width) + 1rem);

        opacity: 0.3333333;

        task-priority-set-content {
            width: max-content;
        }
    }
}

task-priority-set-content {
    height: 0;
    flex-grow: 1;

    display: flex;
    flex-direction: column;
    align-items: start;
}

task-list {
    display: flex;
    gap: 0.5rem;
    flex-direction: column;
    width: 100%;
    flex-grow: 1;
    overflow-y: auto;
    padding-top: 0.5rem;
    
    mask: linear-gradient(#0000, #000 0.5rem);
}

task-priority-divider {
    display: block;
    width: 1px;
    background: oklch(0.8 0.08 200);
}

task-card-animator {
    display: block;
}
</style>