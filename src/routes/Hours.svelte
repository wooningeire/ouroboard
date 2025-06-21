<script lang="ts">
    import {Progress} from "@/ui/progress";
    import TextEntry from "./TextEntry.svelte";

const {
    hrCompleted,
    hrRemaining,
    onHrCompletedChange,
    onHrRemainingChange,
}: {
    hrCompleted: number,
    hrRemaining: number,
    onHrRemainingChange: (value: number) => void,
    onHrCompletedChange: (value: number) => void,
} = $props();

const fractionComplete = $derived(hrCompleted / (hrCompleted + hrRemaining));
</script>

<hours-tracker>
    <big-number style:grid-area="1/1">
        <TextEntry
            value={hrCompleted.toString()}
            onValueChange={text => onHrCompletedChange(Number(text))}
            validate={text => !isNaN(Number(text))}
        />
    </big-number>
    <number-label style:grid-area="2/1">hr done</number-label>

    <big-number style:grid-area="1/2">
        <TextEntry
            value={hrRemaining.toString()}
            onValueChange={text => onHrRemainingChange(Number(text))}
            validate={text => !isNaN(Number(text))}
        />
    </big-number>
    <number-label style:grid-area="2/2">hr rem</number-label>
    
    <hours-summary style:grid-area="3/1 / 4/3">
        <Progress
            value={hrCompleted}
            max={hrCompleted + hrRemaining}
        />

        {(isNaN(fractionComplete) ? 100 : fractionComplete * 100).toFixed(2)}% of {hrCompleted + hrRemaining} hr
    </hours-summary>
</hours-tracker>

<style lang="scss">
hours-tracker {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-areas: auto auto;
    text-align: center;
}

big-number {
    font-size: 1.5rem;
    line-height: 0.85;
}

number-label {
    font-size: 0.75rem;
    opacity: 0.5;
}

</style>