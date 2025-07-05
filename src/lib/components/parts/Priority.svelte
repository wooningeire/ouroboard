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
    display: inline-flex;
    width: fit-content;
    align-items: stretch;

    --bg-col: oklch(0.875 0.07 calc(var(--value) * 40deg));

    border-radius: 0.5rem;
    font-size: 0.875rem;

    outline: 0.0625rem solid var(--bg-col);
    color: oklch(from var(--bg-col) 0.3 calc(c + 0.05) calc(h + 50));

    &.no-priority {
        --bg-col: oklch(0.9 0 0deg);
    }
}
priority-number {
    display: flex;
    justify-content: center;
    width: 1.25rem;

    border-radius: 0.5rem 50% 50% 0.5rem;

    background: oklch(from var(--bg-col) 0.975 calc(c - 0.025) calc(h - 20));
    
    font-family: var(--font-strong);
    line-height: 1.25;
    text-align: center;
    font-size: 1rem;
}

priority-label {
    border-radius: 0 0.5rem 0.5rem 0;
    background: var(--bg-col);
    padding: 0 0.25rem;
}
</style>