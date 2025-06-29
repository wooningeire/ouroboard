<script lang="ts">
import { SvelteFlowProvider } from "@xyflow/svelte";
import Flow from "@/panes/Flow.svelte";
import * as Tabs from "@/ui/tabs/";

import Queue from "@/panes/Queue.svelte";
import {useTasks, tasksContextKey} from "$lib/composables/useTasks.svelte";
    import { setContext } from "svelte";

let whichTab = $state("graph");


const tasksOps = useTasks();
setContext(tasksContextKey, tasksOps);

</script>

<Tabs.Root bind:value={whichTab} class="w-full h-full">
    <Tabs.List>
        <Tabs.Trigger value="graph">Graph</Tabs.Trigger>
        <Tabs.Trigger value="queue">Queue</Tabs.Trigger>
    </Tabs.List>
    
    <Tabs.Content value="graph">
        <SvelteFlowProvider>
            <Flow />
        </SvelteFlowProvider>
    </Tabs.Content>

    <Tabs.Content value="queue">
        <Queue />
    </Tabs.Content>
</Tabs.Root>