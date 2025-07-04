<script lang="ts">
import { api } from "$api/client";
import TextEntry from "./TextEntry.svelte";
import * as DropdownMenu from "@/ui/dropdown-menu";
import * as Tooltip from "$lib/components/ui/tooltip/index.js";
import { Button } from "@/ui/button";
import Priority, { labels } from "./Priority.svelte";
import Hours from "./Hours.svelte";
import {type ReactiveTask} from "$lib/composables/useTasks.svelte";

import collapsedNodeSvg from "$lib/assets/collapsed-node.svg";
import uncollapsedNodeSvg from "$lib/assets/uncollapsed-node.svg";
    import { mount, onMount, tick, untrack } from "svelte";
    import { fade, fly, type TransitionConfig } from "svelte/transition";
    import { cubicInOut, cubicOut } from "svelte/easing";

const {
    task = $bindable(),
    alwaysSelected = false,
    showChildToggle = false,
}: {
    task: ReactiveTask,
    alwaysSelected?: boolean,
    showChildToggle?: boolean,
} = $props();


let innerSelected = $state(false);
const selected = $derived(alwaysSelected || innerSelected);

const expanded = $derived(task.alwaysExpanded || selected);


const saveTitle = async (title: string) => {
    await api.task.edit({
        id: task.id,
        title,
    });
};

const priority = $derived(task.priority);
const priorityString = $derived(priority?.toString() ?? "");

const updatePriority = async (newPriorityString: string) => {
    const newPriority = newPriorityString === "" ? null : Number(newPriorityString);
    task.priority = newPriority;

    await api.task.edit({
        id: task.id,
        priority: newPriority,
    });
};

const done = $derived(task.hrCompleted > 0 && task.hrRemaining === 0);

const updateHoursHistory = async () => {
    await api.task.updateHours({
        id: task.id,
        hr_completed: task.hrCompleted,
        hr_remaining: task.hrRemaining,
    });
};

const updateHrCompleted = async (newHrCompleted: number) => {
    task.hrCompleted = newHrCompleted;

    await updateHoursHistory();
};

const updateHrRemaining = async (newHrRemaining: number) => {
    task.hrRemaining = newHrRemaining;

    await updateHoursHistory();
};


const updateHideChildren = async (newHideChildren: boolean) => {
    task.hideChildren = newHideChildren;

    await api.task.edit({
        id: task.id,
        hide_children: newHideChildren,
    });
};

let elHeight = $state(task.elHeight);
let nOngoingAnimations = $state(0);
let initialAnimationsFinished = $state(false);
let mounted = $state(false);
$effect(() => {
    if (!mounted || selected || !initialAnimationsFinished || nOngoingAnimations > 0) return;
    task.elHeight = elHeight;
});

onMount(() => {
    mounted = true;
});



let el: HTMLUnknownElement;

let contentWidth = $state(0);

let contentHeight = $state(0);
let lastContentHeight = 0;
let transitionHeight = 0;
$effect(() => {
    transitionHeight = Math.min(lastContentHeight, contentHeight);
    lastContentHeight = contentHeight;
});

const slideIn = (node: HTMLElement): TransitionConfig => {
    return {
        duration: 250,
        easing: cubicOut,
        css: (t, u) => `position: absolute; top: ${(expanded ? 1 : -1) * u * transitionHeight}px;`,
    };
};

const slideOut = (node: HTMLElement): TransitionConfig => {
    return {
        duration: 250,
        easing: cubicOut,
        css: (t, u) => `position: absolute; top: ${(expanded ? -1 : 1) * u * transitionHeight}px;`,
    };
};
</script>

<svelte:window
    onclick={event => {
        if (!innerSelected || event.composedPath().includes(el)) return;
        innerSelected = false;
    }}
/>

<task-card
    class:selected
    bind:offsetHeight={null, value => elHeight = value ?? task.elHeight}
    onclick={() => innerSelected = true}
    onkeydown={(event: KeyboardEvent) => event.key === "Enter" && (innerSelected = true)}
    role="button"
    tabindex="0"
    bind:this={el}
    style:--content-height="{contentHeight}px"
    style:--content-width="{contentWidth}px"
    ontransitionstart={() => nOngoingAnimations++}
    ontransitionend={() => {
        nOngoingAnimations--;
        initialAnimationsFinished = true;
    }}
>
    {#key expanded}
        <task-card-scroller>
            <task-card-content
                class:expanded
                class:done
                in:slideIn
                out:slideOut
                bind:offsetWidth={null, value => contentWidth = value ?? 0}
                bind:offsetHeight={null, value => contentHeight = value ?? 0}
            >
                {#if showChildToggle}
                    <Tooltip.Provider
                        delayDuration={0}
                        disableHoverableContent
                    >
                        <Tooltip.Root>
                            <Tooltip.Trigger>
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
                            </Tooltip.Trigger>

                            <Tooltip.Content>
                                {#if task.hideChildren}
                                    Child nodes are hidden; click to <b>show</b> them
                                {:else}
                                    Child nodes are shown; click to <b>hide</b> them
                                {/if}
                            </Tooltip.Content>
                        </Tooltip.Root>
                    </Tooltip.Provider>
                {/if}

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
                    hrCompleted={task.hrCompleted}
                    hrRemaining={task.hrRemaining}
                    onHrCompletedChange={updateHrCompleted}
                    onHrRemainingChange={updateHrRemaining}

                    hrCompletedTotal={task.hrCompletedTotal}
                    hrRemainingTotal={task.hrRemainingTotal}

                    hrEstimateOriginal={task.hrEstimateTotalOriginal}

                    {expanded}
                />
            </task-card-content>
        </task-card-scroller>
    {/key}
</task-card>


<style lang="scss">
task-card {
    flex-shrink: 0;

    display: block;
    width: var(--content-width);
    max-width: 100%;
    height: var(--content-height);
    position: relative;
    overflow: hidden;

    white-space: nowrap;

    background: oklch(1 0 0);

    border-radius: 0.5rem;
    box-shadow:
        0 0.0625rem 0.125rem oklch(0 0 0 / 0.1),
        0 0 0 1px var(--border-col) inset;

    transition:
        height 0.25s cubic-bezier(.17,.67,.5,1),
        width 0.25s cubic-bezier(.17,.67,.5,1);

    --content-width: auto;
    --content-height: auto;
    --border-col: oklch(0.9 0 0);

    &.selected {
        --border-col: oklch(0.6 0.2 20);
    }

}

task-card-scroller {
    display: block;
    width: 100%;
    overflow-x: auto;
}

task-card-content {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    text-align: left;
    width: max-content;
    // min-width: 100%;
    padding: 0.5rem;

    &.expanded {
        flex-direction: column;
        align-items: stretch;

        task-title {
            max-width: unset;
            min-width: 12rem;
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
    white-space: wrap;
}

img {
    width: 1.125rem;
}
</style>