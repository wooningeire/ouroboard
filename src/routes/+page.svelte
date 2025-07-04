<script lang="ts">
import { SvelteFlowProvider } from "@xyflow/svelte";
import Flow from "@/panes/Flow.svelte";
import * as Tabs from "@/ui/tabs/";
import { api } from "$api/client";
import Queue from "@/panes/Queue.svelte";
import {useTasks, tasksContextKey} from "$lib/composables/useTasks.svelte";
    import { onMount, setContext, tick } from "svelte";

let whichTab = $state("graph");


const tasksOps = useTasks();
setContext(tasksContextKey, tasksOps);


const tasksPromise = api.task.list({});

onMount(async () => {
    const {tasks} = await tasksPromise;

    for (const task of tasks) {
        tasksOps.addTask(task);
    }
});

</script>


<Tabs.Root bind:value={whichTab} class="w-full h-full">
    <Tabs.List>
        <Tabs.Trigger value="graph">Graph</Tabs.Trigger>
        <Tabs.Trigger value="queue">Queue</Tabs.Trigger>
    </Tabs.List>
    
    <Tabs.Content value="graph">
        <SvelteFlowProvider>
            <Flow {tasksPromise} />
        </SvelteFlowProvider>
    </Tabs.Content>

    <Tabs.Content value="queue">
        <Queue />
    </Tabs.Content>
</Tabs.Root>

{#await tasksPromise}
    <loading-overlay>Loading items</loading-overlay>
{/await}

<style lang="scss">
loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: oklch(0 0 0 / 0.25);
    display: grid;
    place-items: center;
    color: oklch(1 0 0);
    font-size: 2rem;
}
</style>