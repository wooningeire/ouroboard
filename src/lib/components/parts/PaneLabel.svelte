<script lang="ts">
import type { Snippet } from "svelte";

let {
    title,
    children,
}: {
    title: string,
    children?: Snippet,
} = $props();
</script>


<pane-label>
    <pane-title>
        <h2>{title}</h2>
    </pane-title>

    <pane-options>
        {@render children?.()}
    </pane-options>
</pane-label>

<style lang="scss">
pane-label {
    display: flex;
    align-items: stretch;

    background: linear-gradient(
        0.25turn in oklch,
        oklch(0.96 0.05 190),
        oklch(0.91 0.06 330)
    );
}

pane-title {
    display: flex;
    padding: 0 1.5rem;
    
    background: linear-gradient(
        0.25turn in oklch,
        oklch(0.825 0.12 180),
        oklch(0.825 0.1 200)
    );
    border-radius: 0 0 1.75rem 0 / 0 0 2rem 0;
    font-size: 1.375rem;
    line-height: 1.125;
}

pane-options {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0 1rem;
}
</style>