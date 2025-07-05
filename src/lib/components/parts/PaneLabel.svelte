<script lang="ts">
import type { Snippet } from "svelte";

let {
    title,
    children,
}: {
    title: string,
    children: Snippet,
} = $props();
</script>


<pane-label>
    <pane-title>
        <h2>{title}</h2>
    </pane-title>

    <pane-options>
        {@render children()}
    </pane-options>
</pane-label>

<style lang="scss">
pane-label {
    display: flex;
    align-items: stretch;

    background: linear-gradient(
        0.25turn in oklch,
        oklch(0.96 0.04 190),
        oklch(0.91 0.05 330)
    );
}

pane-title {
    display: flex;
    padding: 0 1rem;
    
    background: oklch(0.875 0.1 180);
    font-size: 1.25rem;
    line-height: 1.25;
}

pane-options {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0 1rem;
}
</style>