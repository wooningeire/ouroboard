<script lang="ts">
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

let el: HTMLUnknownElement;
const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        el.blur();
    }
};

let placeholderEl = $state<HTMLUnknownElement>();

const showsPlaceholder = $derived(placeholder !== null && localValue.length === 0);
const placeholderWidth = $derived.by(() => {
    void showsPlaceholder;
    return placeholderEl?.offsetWidth ?? 0;
});

$inspect(placeholderWidth);
</script>

<text-entry-container
    class:invalid={!valid}
    class:disabled
    class:shows-placeholder={showsPlaceholder}
>
    {#if showsPlaceholder}
        <text-entry-placeholder bind:this={placeholderEl}>{placeholder}</text-entry-placeholder>
    {/if}

    <text-entry
        bind:this={el}
        contenteditable
        role="textbox"
        tabindex="0"
        onblur={handleBlur}
        onkeydown={handleKeydown}
        bind:textContent={localValue}
        {disabled}
        style:--placeholder-width="{placeholderWidth}px"
    ></text-entry>
</text-entry-container>


<style lang="scss">
text-entry-container {
    &.invalid {
        outline: 1px solid oklch(62.828% 0.20996 13.579);
        outline-offset: 0.5rem;
    }

    &.shows-placeholder {
        text-entry {
            min-width: var(--placeholder-width);
        }
    }
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