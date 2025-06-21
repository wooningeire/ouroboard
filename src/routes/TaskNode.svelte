<script lang="ts">
import { Handle, Position, type NodeProps } from "@xyflow/svelte";

let {id, data}: NodeProps = $props();
</script>

<task-node>
    {data.label}
</task-node>

<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} />
