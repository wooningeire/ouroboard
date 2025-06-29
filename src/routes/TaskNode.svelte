<script lang="ts">
import { Handle, Position, type Node, type NodeProps } from "@xyflow/svelte";
import { api, type Task } from "$api/client";
import TextEntry from "./TextEntry.svelte";
import * as DropdownMenu from "@/ui/dropdown-menu";
import { Button } from "@/ui/button";
import Priority, { labels } from "./Priority.svelte";
import Hours from "./Hours.svelte";
import {type ReactiveTask} from "./store.svelte";
import { tick, untrack } from "svelte";

import collapsedNodeSvg from "$lib/assets/collapsed-node.svg";
import uncollapsedNodeSvg from "$lib/assets/uncollapsed-node.svg";

const {
    id,
    selected,
    data: task,
}: NodeProps<Node<ReactiveTask>> = $props();

const expanded = $derived(task.alwaysExpanded || selected);



const saveTitle = async (title: string) => {
    await api.task.edit({
        id: Number(id),
        title,
    });
};

const priority = $derived(task.priority);
const priorityString = $derived(priority?.toString() ?? "");

const updatePriority = async (newPriorityString: string) => {
    const newPriority = newPriorityString === "" ? null : Number(newPriorityString);
    task.priority = newPriority;

    await api.task.edit({
        id: Number(id),
        priority: newPriority,
    });
};

const hrCompleted = $derived(task.hoursHistory.at(-1)?.hr_completed ?? 0);
const hrRemaining = $derived(task.hoursHistory.at(-1)?.hr_remaining ?? 0);
const done = $derived(task.hrCompleted > 0 && task.hrRemaining === 0);

const updateHoursHistory = async () => {
    task.hoursHistory = await api.task.updateHours({
        id: Number(id),
        hr_completed: hrCompleted,
        hr_remaining: hrRemaining,
    });
};

const updateHrCompleted = async (newHrCompleted: number) => {
    task.hoursHistory.push({
        created_at: new Date(),
        hr_completed: newHrCompleted,
        hr_remaining: hrRemaining,
    });

    await updateHoursHistory();
};

const updateHrRemaining = async (newHrRemaining: number) => {
    task.hoursHistory.push({
        created_at: new Date(),
        hr_completed: hrCompleted,
        hr_remaining: newHrRemaining,
    });

    await updateHoursHistory();
};


const updateHideChildren = async (newHideChildren: boolean) => {
    task.hideChildren = newHideChildren;

    await api.task.edit({
        id: Number(id),
        hide_children: newHideChildren,
    });
};

let elHeight = $state(0);
$effect(() => {
    if (selected) return;

    task.elHeight = elHeight;
    task.pos.doNotAnimateNextChange();
});

</script>

<task-node
    class:expanded
    class:done
    bind:clientHeight={elHeight}
>
    <Button
        onclick={event => {
            event.stopPropagation();
            updateHideChildren(!task.hideChildren);
        }}
    >
        {#if task.hideChildren}
                <img src={collapsedNodeSvg} alt="collapsed node" />
        {:else}
                <img src={uncollapsedNodeSvg} alt="uncollapsed node" />
        {/if}
    </Button>

    <task-title>
        <TextEntry
            value={task.title}
            onValueChange={title => saveTitle(title)}
            placeholder="Task title"
            disabled={!expanded}
        />
    </task-title>

    <DropdownMenu.Root>
        <DropdownMenu.Trigger onclick={event => event.stopPropagation()}>
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

        hrCompletedTotal={task.hrCompleted}
        hrRemainingTotal={task.hrRemaining}

        hrEstimateOriginal={task.hrEstimateOriginal}

        {expanded}
    />
</task-node>

<Handle type="target" position={Position.Left} />
{#if !task.hideChildren}
    <Handle type="source" position={Position.Right} />
{/if}


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

img {
    width: 1.125rem;
}
</style>