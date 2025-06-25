<script lang="ts">
import { Handle, Position, type Node, type NodeProps } from "@xyflow/svelte";
import { api, type Task } from "$api/client";
import TextEntry from "./TextEntry.svelte";
import * as DropdownMenu from "@/ui/dropdown-menu";
import { Button } from "@/ui/button";
import Priority, { labels } from "./Priority.svelte";
import Hours from "./Hours.svelte";
import type { TaskData } from "./store.svelte";
import * as store from "./store.svelte";
import { tick } from "svelte";

const {
    id,
    selected,
    data: taskData,
}: NodeProps<Node<TaskData>> = $props();

const expanded = $derived(taskData.task.always_expanded || selected);



const saveTitle = async (title: string) => {
    await api.task.edit({
        id: Number(id),
        title,
    });
};

const priority = $derived(taskData.task.priority);
const priorityString = $derived(priority?.toString() ?? "");

const updatePriority = async (newPriorityString: string) => {
    const newPriority = newPriorityString === "" ? null : Number(newPriorityString);
    taskData.task.priority = newPriority;

    await api.task.edit({
        id: Number(id),
        priority: newPriority,
    });
};

const hrCompleted = $derived(taskData.task.hoursHistory.at(-1)?.hr_completed ?? 0);
const hrRemaining = $derived(taskData.task.hoursHistory.at(-1)?.hr_remaining ?? 0);
const done = $derived(taskData.hrCompleted > 0 && taskData.hrRemaining === 0);

const updateHoursHistory = async () => {
    taskData.task.hoursHistory = await api.task.updateHours({
        id: Number(id),
        hr_completed: hrCompleted,
        hr_remaining: hrRemaining,
    });
};

const updateHrCompleted = async (newHrCompleted: number) => {
    taskData.task.hoursHistory.push({
        created_at: new Date(),
        hr_completed: newHrCompleted,
        hr_remaining: hrRemaining,
    });

    await updateHoursHistory();
};

const updateHrRemaining = async (newHrRemaining: number) => {
    taskData.task.hoursHistory.push({
        created_at: new Date(),
        hr_completed: hrCompleted,
        hr_remaining: newHrRemaining,
    });

    await updateHoursHistory();
};


const updateHideChildren = async (newHideChildren: boolean) => {
    taskData.task.hide_children = newHideChildren;
    store.animateNodePositions();

    await api.task.edit({
        id: Number(id),
        hide_children: newHideChildren,
    });
};


let taskEl = $state<HTMLUnknownElement>();
const elHeight = $derived.by(() => {
    void taskData.task.title;
    return taskEl?.offsetHeight ?? 0;
});

$effect(() => {
    taskData.elHeight = elHeight - 45;

    tick().then(() => {
        store.animateNodePositions();
    });
});
</script>

<task-node
    class:expanded
    class:done
    bind:this={taskEl}
>
    {#if taskData.task.hide_children}
        <Button
            onclick={() => updateHideChildren(false)}
        >
            &#x2192;
        </Button>
    {:else}
        <Button
            onclick={() => updateHideChildren(true)}
        >
            &#x2193;
        </Button>
    {/if}

    <task-title>
        <TextEntry
            value={taskData.task.title}
            onValueChange={title => saveTitle(title)}
            placeholder="Task title"
            disabled={!expanded}
        />
    </task-title>

    <DropdownMenu.Root>
        <DropdownMenu.Trigger>
            {#snippet child({ props })}
                <Button {...props} variant="outline">
                    <Priority value={priority} />
                </Button>
            {/snippet}
        </DropdownMenu.Trigger>

        <DropdownMenu.Content class="w-56">
            <DropdownMenu.Group>
                <DropdownMenu.RadioGroup
                    value={priorityString}
                    onValueChange={updatePriority}
                >
                    {#each labels as _, i}
                        <DropdownMenu.RadioItem value={i.toString()}>
                            <Priority value={i} />
                        </DropdownMenu.RadioItem>
                    {/each}

                    <DropdownMenu.RadioItem value="">
                        <Priority value={null} />
                    </DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroup>
            </DropdownMenu.Group>
        </DropdownMenu.Content>
    </DropdownMenu.Root>


    <Hours
        {hrCompleted}
        {hrRemaining}
        onHrCompletedChange={updateHrCompleted}
        onHrRemainingChange={updateHrRemaining}

        hrCompletedTotal={taskData.hrCompleted}
        hrRemainingTotal={taskData.hrRemaining}

        {expanded}
    />
</task-node>

<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} />


<style lang="scss">
task-node {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    text-align: left;
    padding: 0.5rem;

    &.expanded {
        flex-direction: column;
        align-items: stretch;

        task-title {
            width: 12rem;
        }
    }

    &.done {
        task-title {
            text-decoration: line-through;
        }
    }

    &:not(.expanded).done {
        task-title {
            opacity: 0.25;
        }
    }
}

task-title {
    max-width: 12rem;
    font-size: 1.125rem;
}
</style>