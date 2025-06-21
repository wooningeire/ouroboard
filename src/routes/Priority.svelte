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
    <span>{value}</span>
    <span>
        {#if value !== null}
            {labels[value]}
        {:else}
            No priority
        {/if}
    </span>
</priority-badge>

<style lang="scss">
priority-badge {
    display: flex;
    gap: 0.5rem;

    background: oklch(0.925 0.05 calc(var(--value) * 40deg));
    padding: 0 0.5rem;
    border-radius: 0.5rem;

    &.no-priority {
        background: oklch(0.9 0 0deg);
    }
}
</style>