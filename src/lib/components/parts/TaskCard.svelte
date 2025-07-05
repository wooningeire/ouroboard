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
import { onDestroy, onMount } from "svelte";
import { fade, fly, type TransitionConfig } from "svelte/transition";
import { cubicInOut, cubicOut } from "svelte/easing";

const {
    task,
    forceSelected = false,
    showChildToggle = false,
    constrainMaxWidth = false,
    onSelectedChange = () => {},
}: {
    task: ReactiveTask,
    forceSelected?: boolean,
    showChildToggle?: boolean,
    constrainMaxWidth?: boolean,
    onSelectedChange?: (selected: boolean) => void,
} = $props();


let innerSelected = $state(false);
const selected = $derived(forceSelected || innerSelected);

const expanded = $derived(task.alwaysExpanded || selected);


const saveTitle = async (title: string) => {
    task.title = title;

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
    if (!mounted) {
        return { duration: 0 };
    }

    return {
        duration: 350,
        easing: cubicOut,
        css: (t, u) => `position: absolute; top: ${(expanded ? 1 : -1) * u * transitionHeight}px;`,
    };
};

const slideOut = (node: HTMLElement): TransitionConfig => {
    if (!mounted) {
        return { duration: 0 };
    }

    return {
        duration: 350,
        easing: cubicOut,
        css: (t, u) => `position: absolute; top: ${(expanded ? -1 : 1) * u * transitionHeight}px;`,
    };
};


let recentlySelected = $state(false);
$effect(() => {
    if (selected) {
        recentlySelected = true;
        return;
    }

    setTimeout(() => {
        recentlySelected = false;
    }, 350);
});

let transitioning = $state(false);
let mounted = $state(false);

onMount(() => {
    setTimeout(() => {
        mounted = true;
    });
});

let elHeight = $state(task.elHeight);
$effect(() => {
    if (recentlySelected || transitioning || elHeight === 0) return;
    task.elHeight = elHeight;
});
</script>

<svelte:window
    onclick={event => {
        if (!innerSelected || event.composedPath().includes(el)) return;
        innerSelected = false;
        onSelectedChange(false);
    }}
/>

<task-card
    class:selected
    class:mounted
    class:constrain-max-width={constrainMaxWidth}
    bind:offsetHeight={null, value => elHeight = el.offsetHeight}
    onclick={() => {
        innerSelected = true;
        onSelectedChange(true);
    }}
    onkeydown={(event: KeyboardEvent) => event.key === "Enter" && (innerSelected = true)}
    role="button"
    tabindex="0"
    bind:this={el}
    style:--content-height={mounted ? `${contentHeight}px` : "auto"}
    style:--content-width={mounted ? `${contentWidth}px` : "auto"}
    ontransitionstart={() => transitioning = true}
    ontransitionend={() => transitioning = false}
>
    {#key expanded}
        <task-card-scroller>
            <task-card-content
                class:expanded
                class:done={task.done}
                in:slideIn
                out:slideOut
                bind:offsetWidth={null, value => contentWidth = value ?? 0}
                bind:offsetHeight={null, value => contentHeight = value ?? 0}
            >
                {#if showChildToggle}
                    <task-child-toggle>
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
                    </task-child-toggle>
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

                    <DropdownMenu.Content>
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
    
    &.constrain-max-width {
        width: calc(min(100%, var(--content-width)));
    }
    &:not(.constrain-max-width) {
        width: var(--content-width);
    }

    height: var(--content-height);
    position: relative;
    overflow: hidden;

    white-space: nowrap;

    background: oklch(1 0 0);

    border-radius: 0.5rem;
    box-shadow:
        0 0.0625rem 0.125rem oklch(0 0 0 / 0.1),
        var(--selected-box-shadow);

    &.mounted {
        transition:
            height 0.35s cubic-bezier(.3,0,.1,1),
            width 0.35s cubic-bezier(.3,0,.1,1),
            box-shadow 0.35s cubic-bezier(.3,0,.1,1);
    }

    --content-width: auto;
    --content-height: auto;
    --border-col: oklch(0.9 0 0);
    --selected-box-shadow: 0 0 0 0.0625rem var(--border-col) inset;

    &.selected {
        --border-col: oklch(0.8 0.2 30);

        box-shadow:
            0 0.25rem 2rem oklch(0 0 0 / 0.25),
            var(--selected-box-shadow);

        position: relative;
        z-index: 1;
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
    max-width: 10rem;
    font-size: 1rem;
    white-space: wrap;
}

img {
    width: 1rem;
    height: 1rem;
}
</style>