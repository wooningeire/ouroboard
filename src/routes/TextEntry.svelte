<script lang="ts">
let {
    value,
    onValueChange,
}: {
    value: string,
    onValueChange: (value: string) => void,
} = $props();


let localValue = $state(value);
$effect(() => {
    localValue = value;
});

const handleBlur = () => {
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

<text-entry
    bind:this={el}
    contenteditable
    role="textbox"
    tabindex="0"
    onblur={handleBlur}
    onkeydown={handleKeydown}
    bind:textContent={localValue}
></text-entry>


<style lang="scss">
text-entry {
    display: block;
    width: 20ch;
    padding: 0 0.25rem;
    resize: none;
}
</style>