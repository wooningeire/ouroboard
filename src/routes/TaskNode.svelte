<script lang="ts">
import { Handle, Position, type Node, type NodeProps } from "@xyflow/svelte";
import { api } from "$api/client";
import TextEntry from "./TextEntry.svelte";
import * as DropdownMenu from "@/ui/dropdown-menu";
import { Button } from "@/ui/button";
import Priority, { labels } from "./Priority.svelte";

let { id, data }: NodeProps<Node<Awaited<ReturnType<typeof api.task.new>>>> = $props();

const saveTitle = async (title: string) => {
    await api.task.edit({
        id: Number(id),
        title,
    });
};

let priorityString = $state(data.priority?.toString() ?? "");
const priority = $derived(priorityString === "" ? null : Number(priorityString));

$effect(() => {
    void priorityString;
    if (priorityString === null) return;

    (async () => {
        await api.task.edit({
            id: Number(id),
            priority: Number(priorityString),
        });
    })();
})
</script>

<task-node>
    <TextEntry
        value={data.title}
        onValueChange={title => saveTitle(title)}
        placeholder="Task title"
    />

    <DropdownMenu.Root>
        <DropdownMenu.Trigger>
            {#snippet child({ props })}
                <Button {...props} variant="outline">
                    <Priority value={priority} />
                </Button>
            {/snippet}
        </DropdownMenu.Trigger>

        <DropdownMenu.Content class="w-56">
            <DropdownMenu.Group>
                <DropdownMenu.RadioGroup bind:value={priorityString}>
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
</task-node>

<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} />


<style lang="scss">
task-node {
    display: flex;
    flex-direction: column;
    text-align: left;
}
</style>