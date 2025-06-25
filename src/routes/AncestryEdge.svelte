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
import * as store from "./store.svelte";
 
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

const clearParentId = async () => {
    const childId = Number(target);

    const task = store.getTask(childId);
    if (task !== undefined) {
        store.setNewTaskParent(task.task, null);
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