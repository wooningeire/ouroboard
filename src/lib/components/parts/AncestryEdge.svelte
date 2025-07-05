<script lang="ts" module>
const lastPositions = new Map<string, {
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
}>();
</script>

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
import {useTasksSet, tasksContextKey} from "$lib/composables/useTasksSet.svelte";
    import { getContext, onMount, tick } from "svelte";
 
const { id, sourceX, sourceY, targetX, targetY, target, selected }: EdgeProps = $props();



// This is needed for path animations

const newSourceCoords = {
    sourceX,
    sourceY,
    targetX,
    targetY,
};

let sourceCoords = $state(lastPositions.get(id) ?? newSourceCoords);
lastPositions.set(id, newSourceCoords);

setTimeout(() => {
    sourceCoords = newSourceCoords;
});


const [edgePath, labelX, labelY] = $derived(
    getBezierPath({
        ...sourceCoords,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,  
    }),
);


const tasksOps = getContext<ReturnType<typeof useTasksSet>>(tasksContextKey);

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