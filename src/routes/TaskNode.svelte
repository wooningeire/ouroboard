<script lang="ts">
import { Handle, Position, type Node, type NodeProps } from "@xyflow/svelte";
import { api } from "$api/client";
    import TextEntry from "./TextEntry.svelte";

let { id, data }: NodeProps<Node<Awaited<ReturnType<typeof api.task.new>>>> = $props();

const saveTitle = async (title: string) => {
    await api.task.edit({
        id: Number(id),
        title,
    });
};

</script>

<task-node>
    <TextEntry
        value={data.title}
        onValueChange={title => saveTitle(title)}
    />
</task-node>

<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} />


<style lang="scss">
task-node {
    text-align: left;
}

textarea {
    width: 20ch;
    padding: 0 0.25rem;
    resize: none;
}
</style>