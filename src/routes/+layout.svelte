<script lang="ts">
import BgOverlay from "@/parts/BgOverlay.svelte";
import "./index.scss";
import './shadcn.css';

let { children } = $props();
</script>

<layout-container>
    <BgOverlay />

    <page-content>
        {@render children()}
    </page-content>
</layout-container>


<style lang="scss">
layout-container {
    display: grid;
    place-items: stretch;
    width: 100vw;
    height: 100vh;
    overflow: hidden;

    > :global(*) {
        grid-area: 1/1;
    }
}
</style>