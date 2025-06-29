<script lang="ts">
import {
    BaseEdge,
    type EdgeProps,
    EdgeLabel,
    getBezierPath,
    Position,
} from "@xyflow/svelte";
import Button from '@/ui/button/button.svelte';
import { api } from "$api/client";
import {useTasks, tasksContextKey} from "$lib/composables/useTasks.svelte";
    import { getContext } from "svelte";
 
const { id, sourceX, sourceY, targetX, targetY, target, selected }: EdgeProps = $props();
 
const [edgePath, labelX, labelY] = $derived(
    getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    }),
);

const tasksOps = getContext<ReturnType<typeof useTasks>>(tasksContextKey);

const clearParentId = async () => {
    const childId = Number(target);

    const task = tasksOps.getTask(childId);
    if (task !== undefined) {
        task.parentId = null;
    }

    await api.task.edit({
        id: childId,
        parent_id: null,
    });
};
</script>

<BaseEdge {id} path={edgePath} />

{#if selected}
    <EdgeLabel x={labelX} y={labelY}>
        <Button
            class="nodrag nopan"
            onclick={clearParentId}
        >
            Unlink
        </Button>
    </EdgeLabel>
{/if}