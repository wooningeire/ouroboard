<script lang="ts">
import {TextInput} from "@vaie/hui";

let {
    value,
    onValueChange,
    placeholder = null,
    validate = () => true,
    disabled = false,
}: {
    value: string,
    onValueChange: (value: string) => void,
    placeholder?: string | null,
    validate?: (value: string) => boolean,
    disabled?: boolean,
} = $props();
</script>

<TextInput
    {value}
    {onValueChange}
    placeholderText={placeholder ?? ""}
    {validate}
    {disabled}
>
    {#snippet input({localText, onLocalTextChange, el, onElChange, elProps, valid})}
        <text-entry
            bind:this={() => el, onElChange}
            bind:textContent={() => localText, onLocalTextChange}
            {...elProps}
            contenteditable
            class:invalid={!valid}
        ></text-entry>
    {/snippet}
</TextInput>


<style lang="scss">
text-entry {
    display: block;
    grid-area: 1/1;

    &.invalid {
        outline: 1px solid oklch(62.828% 0.20996 13.579);
        outline-offset: 0.5rem;
    }
}
</style>