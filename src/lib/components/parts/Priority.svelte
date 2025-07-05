<script lang="ts" module>
export const labels = [
    "Urgent",
    "Necessary",
    "Advisable",
    "Target",
    "Desirable",
    "Wishful",
];
</script>

<script lang="ts">
const {
    value = null,
}: {
    value?: number | null,
} = $props();

</script>

<priority-badge
    class:no-priority={value === null}
    style:--value={value ?? ""}
>
    <priority-number>{value ?? "\u00d7"}</priority-number>
    <priority-label>
        {#if value !== null}
            {labels[value]}
        {:else}
            No priority
        {/if}
    </priority-label>
</priority-badge>

<style lang="scss">
priority-badge {
    display: flex;
    align-items: stretch;

    --bg-col: oklch(0.925 0.05 calc(var(--value) * 40deg));

    border-radius: 0.5rem;
    font-size: 0.75rem;

    &.no-priority {
        --bg-col: oklch(0.9 0 0deg);
    }
}
priority-number {
    display: block;
    width: 1.25rem;
    text-align: center;
    border-radius: 0.5rem 0 0 0.5rem;
    background: oklch(from var(--bg-col) calc(l + 0.05) calc(c - 0.025) h);
    padding: 0 0.25rem;
}

priority-label {
    border-radius: 0 0.5rem 0.5rem 0;
    background: var(--bg-col);
    padding: 0 0.25rem;
}
</style>