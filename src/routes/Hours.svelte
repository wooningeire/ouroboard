<script lang="ts">
import {Progress} from "@/ui/progress";
import TextEntry from "./TextEntry.svelte";

const {
    hrCompleted,
    hrRemaining,
    onHrCompletedChange,
    onHrRemainingChange,

    hrCompletedTotal,
    hrRemainingTotal,

    hrEstimateOriginal,

    expanded = true,
}: {
    hrCompleted: number,
    hrRemaining: number,
    onHrRemainingChange: (value: number) => void,
    onHrCompletedChange: (value: number) => void,

    hrCompletedTotal: number,
    hrRemainingTotal: number,

    hrEstimateOriginal: number,

    expanded?: boolean,
} = $props();


const hrEstimateTotal = $derived(hrCompletedTotal + hrRemainingTotal);

const fractionComplete = $derived(hrCompletedTotal / hrEstimateTotal);
</script>

<hours-tracker class:expanded>
    <hours-summary style:grid-area="1/1 / 2/-1">
        <Progress
            value={hrCompletedTotal}
            max={hrEstimateTotal}
        />

        <hours-summary-text>
            <span>{(isNaN(fractionComplete) ? 100 : fractionComplete * 100).toFixed(expanded ? 2 : 0)}%</span>
            {#if !expanded}
                <span>&#x2022;</span>
                <span>{hrCompletedTotal} / {hrRemainingTotal} / {hrEstimateTotal} ({hrEstimateOriginal})</span>
            {/if}
        </hours-summary-text>
    </hours-summary>

    {#if expanded}
        <total-hours-display>
            <big-number style:grid-area="1/1">{hrCompletedTotal}</big-number>
            <number-label style:grid-area="2/1">hr cmp</number-label>
            <number-entry style:grid-area="3/1">
                <TextEntry
                    value={hrCompleted.toString()}
                    onValueChange={text => onHrCompletedChange(Number(text))}
                    validate={text => !isNaN(Number(text))}
                />
            </number-entry>


            <big-number style:grid-area="1/2">{hrRemainingTotal}</big-number>
            <number-label style:grid-area="2/2">hr rem</number-label>
            <number-entry style:grid-area="3/2">
                <TextEntry
                    value={hrRemaining.toString()}
                    onValueChange={text => onHrRemainingChange(Number(text))}
                    validate={text => !isNaN(Number(text))}
                />
            </number-entry>


            <big-number style:grid-area="1/3">{hrEstimateTotal}</big-number>
            <number-label style:grid-area="2/3">hr est</number-label>
        </total-hours-display>
    {/if}
</hours-tracker>

<style lang="scss">
hours-tracker {
    display: flex;
    flex-direction: column;
    text-align: center;

    &:not(.expanded) {
        min-width: 10rem;
    }
}

total-hours-display {
    margin-top: 0.5rem;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto auto auto;
}

hours-summary {
    display: flex;
    flex-direction: column;
    align-items: center;
}

hours-summary-text {
    display: flex;
    gap: 0.375rem;
}

big-number {
    font-size: 1.125rem;
    line-height: 0.75;
}

number-label {
    font-size: 0.75rem;
    opacity: 0.5;
}

</style>