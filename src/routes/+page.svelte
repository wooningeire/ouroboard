<script lang="ts">
import { SvelteFlowProvider } from "@xyflow/svelte";
import Graph from "@/panes/Graph.svelte";
import { api } from "$api/client";
import PriorityBoard from "@/panes/PriorityBoard.svelte";
import {useTasksSet, tasksContextKey} from "$lib/composables/useTasksSet.svelte";
    import { onMount, setContext } from "svelte";
    import Queue from "@/panes/Queue.svelte";
    import BgOverlay from "@/parts/BgOverlay.svelte";
    import Button from "@/ui/button/button.svelte";


const tasksSet = useTasksSet();
setContext(tasksContextKey, tasksSet);


let tasksPromise = $state(api.task.list({}));
const retryTaskLoad = () => {
    tasksPromise = api.task.list({});
};


onMount(async () => {
    const {tasks} = await tasksPromise;

    for (const task of tasks) {
        tasksSet.addTask(task);
    }
});

</script>

<main>
    <title-bar>
        <h1>ouroboard</h1>
    </title-bar>

    <panes-grid>
        <graph-container>
            <SvelteFlowProvider>
                <Graph {tasksPromise} />
            </SvelteFlowProvider>
        </graph-container>

        <prio-container>
            <PriorityBoard />
        </prio-container>

        <queue-container>
            <Queue />
        </queue-container>

        {#await tasksPromise}
            <loading-overlay>
                <loading-overlay-text>Loading items</loading-overlay-text>
            </loading-overlay>
        {:catch}
            <loading-overlay>
                <Button onclick={retryTaskLoad}>Couldn't load tasks</Button>
            </loading-overlay>
        {/await}
    </panes-grid>
</main>

<style lang="scss">
main {
    width: 100vw;
    height: 100vh;

    display: flex;
    flex-direction: column;
    position: relative;
}

title-bar {
    display: flex;
    padding: 0 0.5rem;

    line-height: 1;

    > h1 {
        font-size: 2.5rem;
    }
}

panes-grid {
    height: 0;
    flex-grow: 1;

    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    place-items: stretch;
    gap: 0.5rem;
    padding: 0.5rem;

    border-radius: 1.875rem / 2.25rem;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    background: linear-gradient(
        0.25turn in oklch,
        oklch(0.5 0.08 195),
        oklch(0.5 0.08 310),
    );

    > * {
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;

        display: grid;
        place-items: stretch;
        overflow: hidden;
        position: relative;

        border-radius: 1.5rem / 2rem;
        background: linear-gradient(
            0.25turn in oklch,
            oklch(0.985 0.01 205),
            oklch(0.985 0.01 295)
        );
    }
}

graph-container {
    grid-area: 1/1 / 2/3;
}

prio-container {
    grid-area: 2/1;
}

queue-container {
    grid-area: 2/2;
}

loading-overlay {
    grid-area: 1/1 / 3/3;

    display: grid;
    place-items: center;
    position: relative;

    font-size: 3rem;
    font-family: var(--font-strong);

    color: oklch(1 0 0);
    background: linear-gradient(
        0.25turn in oklch,
        oklch(0.3 0.08 190 / 0.85),
        oklch(0.3 0.08 270 / 0.85)
    );
    box-shadow: 0 0 8rem oklch(1 0 0 / 0.75) inset;
}
</style>