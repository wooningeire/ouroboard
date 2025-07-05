<script lang="ts">
import { SvelteFlowProvider } from "@xyflow/svelte";
import Flow from "@/panes/Flow.svelte";
import * as Tabs from "@/ui/tabs/";
import { api } from "$api/client";
import Queue from "@/panes/Queue.svelte";
import {useTasksSet, tasksContextKey} from "$lib/composables/useTasksSet.svelte";
    import { onMount, setContext } from "svelte";

let whichTab = $state("graph");


const tasksSet = useTasksSet();
setContext(tasksContextKey, tasksSet);


const tasksPromise = api.task.list({});

onMount(async () => {
    const {tasks} = await tasksPromise;

    for (const task of tasks) {
        tasksSet.addTask(task);
    }
});

</script>

<main>
    <title-bar>OUROBOARD</title-bar>

    <panes-grid>
        <graph-container>
            <SvelteFlowProvider>
                <Flow {tasksPromise} />
            </SvelteFlowProvider>
        </graph-container>

        <queue-container>
            <Queue />
        </queue-container>

        {#await tasksPromise}
            <loading-overlay>Loading items</loading-overlay>
        {/await}
    </panes-grid>
</main>

<style lang="scss">
main {
    width: 100vw;
    height: 100vh;
}

panes-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    place-items: stretch;
    gap: 0.5rem;
    padding: 0.5rem;

    > * {
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;

        border-radius: 0.5rem;
    }
}

graph-container {
    grid-area: 1/1;
}

queue-container {
    grid-area: 1/2;
}

loading-overlay {
    grid-area: 1/1 / -1/-1;

    display: grid;
    place-items: center;

    font-size: 2rem;

    color: oklch(1 0 0);
    background: oklch(0 0 0 / 0.5);
}
</style>