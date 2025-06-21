<script lang="ts">
import { Handle, Position, type Node, type NodeProps } from "@xyflow/svelte";
import { api } from "$api/client";
import TextEntry from "./TextEntry.svelte";
import * as DropdownMenu from "@/ui/dropdown-menu";
import { Button } from "@/ui/button";
import Priority, { labels } from "./Priority.svelte";
    import Hours from "./Hours.svelte";

let { id, data }: NodeProps<Node<Awaited<ReturnType<typeof api.task.new>>>> = $props();

const saveTitle = async (title: string) => {
    await api.task.edit({
        id: Number(id),
        title,
    });
};

let isFirstRun = true;

let priorityString = $state(data.priority?.toString() ?? "");
const priority = $derived(priorityString === "" ? null : Number(priorityString));

$effect(() => {
    void priority;

    if (isFirstRun) return;

    (async () => {
        await api.task.edit({
            id: Number(id),
            priority,
        });
    })();
});

let hrCompleted = $state(0);
let hrRemaining = $state(0);

$effect(() => {
    void hrCompleted;
    void hrRemaining;

    if (isFirstRun) return;

    (async () => {
        await api.task.updateHours({
            id: Number(id),
            hr_completed: hrCompleted,
            hr_remaining: hrRemaining,
        });
    })();
});

$effect(() => {
    isFirstRun = false;
});

</script>

<task-node>
    <task-title>
        <TextEntry
            value={data.title}
            onValueChange={title => saveTitle(title)}
            placeholder="Task title"
        />
    </task-title>

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


    <Hours
        {hrCompleted}
        {hrRemaining}
        onHrCompletedChange={value => hrCompleted = value}
        onHrRemainingChange={value => hrRemaining = value}
    />
</task-node>

<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} />


<style lang="scss">
task-node {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    text-align: left;
}

task-title {
    width: 20ch;
}
</style>