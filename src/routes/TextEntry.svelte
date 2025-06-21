<script lang="ts">
let {
    value,
    onValueChange,
    placeholder = null,
    validate = () => true,
}: {
    value: string,
    onValueChange: (value: string) => void,
    placeholder?: string | null,
    validate?: (value: string) => boolean,
} = $props();


let localValue = $state(value);
const valid = $derived(validate(localValue));

$effect(() => {
    localValue = value;
});

const handleBlur = () => {
    if (localValue === value) return;

    if (!valid) {
        localValue = value;
        return;
    }

    onValueChange(localValue);
};

let el: HTMLDivElement;
const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        el.blur();
    }
};
</script>

<text-entry-container
    class:invalid={!valid}
>
    {#if placeholder !== null && localValue.length === 0}
        <text-entry-placeholder>{placeholder}</text-entry-placeholder>
    {/if}

    <text-entry
        bind:this={el}
        contenteditable
        role="textbox"
        tabindex="0"
        onblur={handleBlur}
        onkeydown={handleKeydown}
        bind:textContent={localValue}
    ></text-entry>
</text-entry-container>


<style lang="scss">
text-entry-container.invalid {
    outline: 1px solid oklch(62.828% 0.20996 13.579);
    outline-offset: 0.5rem;
}

text-entry {
    display: block;
}

text-entry-placeholder {
    opacity: 0.3333333;
    position: absolute;
    pointer-events: none;
    user-select: none;
}
</style>