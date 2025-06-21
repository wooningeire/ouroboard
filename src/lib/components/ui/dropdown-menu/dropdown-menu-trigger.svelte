<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

	let { ref = $bindable(null), ...restProps }: DropdownMenuPrimitive.TriggerProps = $props();
</script>

<DropdownMenuPrimitive.Trigger
	bind:ref
	data-slot="dropdown-menu-trigger"
	class="dropdown-menu-trigger"
	{...restProps}
/>

<style lang="scss">
:global(.dropdown-menu-trigger) {
	width: min-content;
	height: max-content;

	padding: 0.25rem;

	&:hover {
		cursor: pointer;
		background: #0000001f;
	}
}
</style>