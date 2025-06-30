<script lang="ts">
import { tasksContextKey, useTasks } from "$lib/composables/useTasks.svelte";
    import { getContext } from "svelte";

const tasksOps = getContext<ReturnType<typeof useTasks>>(tasksContextKey);
</script>

