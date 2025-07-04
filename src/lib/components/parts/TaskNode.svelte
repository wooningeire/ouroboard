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

<TaskCard
    {task}
    alwaysSelected={selected}
    showChildToggle
/>

<Handle type="target" position={Position.Left} />
{#if !task.hideChildren}
    <Handle type="source" position={Position.Right} />
{/if}