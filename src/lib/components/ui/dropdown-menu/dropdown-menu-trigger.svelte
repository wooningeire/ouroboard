<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

	let { ref = $bindable(null), ...restProps }: DropdownMenuPrimitive.TriggerProps = $props();
</script>

<DropdownMenuPrimitive.Trigger
	bind:ref
	data-slot="dropdown-menu-trigger"
	class="dropdown-menu-trigger ouroboard-button"
	{...restProps}
/>

<style lang="scss">
:global(.dropdown-menu-trigger) {
	height: max-content;
}
</style>