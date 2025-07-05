<script lang="ts">
import { Handle, Position, type Node, type NodeProps } from "@xyflow/svelte";
import {ReactiveTask} from "$lib/composables/useTasks.svelte";

import TaskCard from "./TaskCard.svelte";

const {
    selected,
    data = $bindable(),
}: NodeProps<Node<any>> = $props();

const task = $derived<ReactiveTask>(data);
</script>

<task-spacer
    style:--height="{task.elHeight}px"
>
    <TaskCard
        {task}
        forceSelected={selected}
        showChildToggle
    />
</task-spacer>

<Handle type="target" position={Position.Left} />
{#if !task.hideChildren}
    <Handle type="source" position={Position.Right} />
{/if}


<style lang="scss">
task-spacer {
    --height: auto;

    display: block;
    height: var(--height);
}
</style>