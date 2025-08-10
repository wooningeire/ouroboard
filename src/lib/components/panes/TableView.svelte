<script lang="ts">
import { TasksSet } from "$lib/composables/TasksSet.svelte";
import { getContext } from "svelte";
import { TASKS_CONTEXT_KEY } from "../../../routes/+page.svelte";
    import PaneLabel from "@/parts/PaneLabel.svelte";
    import { SvelteSet } from "svelte/reactivity";
    import { Task } from "$lib/composables/Task.svelte";
    import { useTasksSorter } from "$lib/composables/useTasksSorter.svelte";

const tasksSet = getContext<TasksSet>(TASKS_CONTEXT_KEY);

const tasks = $state(new SvelteSet<Task>());
useTasksSorter({
    tasksSet,
    filterTask: () => true,
    mapTaskToBucket: task => tasks,
});

const cols = [
    {
        heading: "title",
        get: (task: Task) => task.title,
    },
    {
        heading: "priority",
        get: (task: Task) => task.priority,
    },
    {
        heading: "parent",
        get: (task: Task) => task.parentId === null
            ? null
            : tasksSet.getTask(task.parentId)?.title ?? null,
    },
    {
        heading: "hide children",
        get: (task: Task) => task.hideChildren,
    },
    {
        heading: "always expanded",
        get: (task: Task) => task.alwaysExpanded,
    },
    {
        heading: "clear",
        get: (task: Task) => task.clear,
    },
    {
        heading: "trashed",
        get: (task: Task) => task.trashed,
    },
    {
        heading: "hr completed",
        get: (task: Task) => task.hrCompleted,
    },
    {
        heading: "hr remaining",
        get: (task: Task) => task.hrRemaining,
    },
    {
        heading: "hr estimated orig",
        get: (task: Task) => task.hrEstimatedOrig,
    },
    {
        heading: "done",
        get: (task: Task) => task.done,
    },
    {
        heading: "visible",
        get: (task: Task) => task.visible,
    },
    {
        heading: "is parent",
        get: (task: Task) => task.isParent,
    },
    {
        heading: "ancestors",
        get: (task: Task) => task.ancestorTasks.map(task => task.title).join(", "),
    },
];
</script>


<PaneLabel title="table" />

<table-viewer style:--n-cols={cols.length}>
    {#each cols as col (col.heading)}
        <table-heading>{col.heading}</table-heading>
    {/each}

    {#each tasks as task (task.id)}
        {#each cols as col (col.heading)}
            <table-cell>{col.get(task)}</table-cell>
        {/each}
    {/each}
</table-viewer>

<style lang="scss">
table-viewer {
    display: grid;
    grid-template-columns: repeat(var(--n-cols), 1fr);
    gap: 0.5rem;
    padding: 0.5rem;
    overflow: scroll;
}

table-heading {
    font-weight: 700;
    white-space: nowrap;
}
</style>