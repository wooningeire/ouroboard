<script lang="ts">
import { Handle, Position, type Node, type NodeProps } from "@xyflow/svelte";

import TaskCard from "./TaskCard.svelte";
import { GraphTask } from "$lib/composables/GraphTask.svelte";

const {
    selected,
    data = $bindable(),
}: NodeProps<Node<any>> = $props();

const graphTask = $derived<GraphTask>(data);
const task = $derived(data.task);
</script>

<task-spacer
    style:--height="{graphTask.elDimensions.height}px"
>
    <TaskCard
        {task}
        forceSelected={selected}
        showChildToggle
        onElWidthChange={width => graphTask.elDimensions.width = width}
        onElHeightChange={height => graphTask.elDimensions.height = height}
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