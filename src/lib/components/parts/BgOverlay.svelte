<script lang="ts">
import bgUrl from "$lib/assets/bg.png";
</script>

<bg-overlay style:--bg-url="url({bgUrl})"></bg-overlay>

<style lang="scss">
bg-overlay {
    display: block;
    transform: rotate(10deg) scale(2);

    background: var(--bg-url);
    background-size: 5rem;

    mix-blend-mode: overlay;
    pointer-events: none;
}
</style>