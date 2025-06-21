<script lang="ts">
let {
    value,
    onValueChange,
    placeholder = null,
}: {
    value: string,
    onValueChange: (value: string) => void,
    placeholder?: string | null,
} = $props();


let localValue = $state(value);
$effect(() => {
    localValue = value;
});

const handleBlur = () => {
    if (localValue === value) return;
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

<text-entry-container>
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
text-entry-container {
    padding: 0 0.25rem;
}

text-entry {
    display: block;
    width: 20ch;
}

text-entry-placeholder {
    opacity: 0.3333333;
    position: absolute;
    pointer-events: none;
    user-select: none;
}
</style>