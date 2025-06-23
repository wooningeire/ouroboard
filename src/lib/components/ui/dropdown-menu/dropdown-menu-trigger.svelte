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
	height: max-content;

	padding: 0.25rem;
	font-weight: 400;

	border: 1px solid #0000001f;

	&:hover {
		cursor: pointer;
		background: #0000000f;
	}
}
</style>