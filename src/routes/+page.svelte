<script lang="ts">
import { SvelteFlowProvider } from "@xyflow/svelte";
import Flow from "./Flow.svelte";
import * as Tabs from "$lib/components/ui/tabs/";

let whichTab = $state("graph");
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

    </Tabs.Content>
</Tabs.Root>