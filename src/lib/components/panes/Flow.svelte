<script lang="ts">
import { Background, MiniMap, SvelteFlow, useSvelteFlow } from "@xyflow/svelte";
import "@xyflow/svelte/dist/style.css";
import type { OnConnectStart, OnConnectEnd, OnConnect, OnDelete, Connection, Node, Edge, OnSelectionChange } from "@xyflow/svelte";
import TaskNode from "@/parts/TaskNode.svelte";
import { api } from "$api/client";
import {useTasksSet, tasksContextKey, ReactiveTask} from "$lib/composables/useTasksSet.svelte";
import { getContext, onMount, tick } from "svelte";
import * as DropdownMenu from "@/ui/dropdown-menu";
import AncestryEdge from "@/parts/AncestryEdge.svelte";
    import { useTasksSorter } from "$lib/composables/useTasksSorter.svelte";
    import { SvelteMap, SvelteSet } from "svelte/reactivity";
    import { useTasksGraphLayout as useTasksGraph } from "$lib/composables/useTasksGraphLayout.svelte";
    import PaneLabel from "@/parts/PaneLabel.svelte";

const {
    tasksPromise,
}: {
    tasksPromise: Promise<unknown>,
} = $props();

const { fitView } = useSvelteFlow();

let contextMenuOpen = $state(false);
let contextMenuPosition = $state({ x: 0, y: 0 });


const tasksSet = getContext<ReturnType<typeof useTasksSet>>(tasksContextKey);



const createNewTask = async (parentNodeId: number | null=null) => {
    const placeholderTask = tasksSet.addTask({
        id: -1,
        created_at: new Date(),
        title: "",
        desc: null,
        target_start: null,
        target_end: null,
        hard_end: null,
        priority: null,
        clear: false,
        parent_id: parentNodeId,
        trashed: false,
        hide_children: false,
        always_expanded: false,
        hr_completed: 0,
        hr_remaining: 0,
        hr_estimated_orig: 0,
    });

    const taskResponse = await api.task.new({
        parent_id: parentNodeId,
    });

    placeholderTask.id = taskResponse.id;
};

const createNewRootTask = async () => {
    await createNewTask();
    contextMenuOpen = false;
};

const onPaneContextMenu = ({ event }: {event: MouseEvent}) => {
    event.preventDefault();
    contextMenuPosition = { x: event.clientX, y: event.clientY };
    contextMenuOpen = true;
};

const onPaneClick = () => {
    contextMenuOpen = false;
};



let lastConnectionDropped = false;
let parentNodeId: string | null = null;
const onConnectStart: OnConnectStart = (event, {nodeId, handleType}) => {
    lastConnectionDropped = true;

    if (handleType === "source") {
        parentNodeId = nodeId;
    }
};

const onConnectEnd: OnConnectEnd = (event) => {
    if (lastConnectionDropped && parentNodeId !== null) {
        // let screenX: number;
        // let screenY: number;

        // if (event instanceof MouseEvent) {
        //     screenX = event.clientX;
        //     screenY = event.clientY;
        // } else if (event instanceof TouchEvent && event.changedTouches.length > 0) {
        //     screenX = event.changedTouches[0].clientX;
        //     screenY = event.changedTouches[0].clientY;
        // } else {
        //     screenX = 0;
        //     screenY = 0;
        // }

        createNewTask(Number(parentNodeId));
    }

    lastConnectionDropped = false;
    parentNodeId = null;
};

const onConnect: OnConnect = async (connection: Connection) => {
    lastConnectionDropped = false;

    const parentId = Number(connection.source);
    const childId = Number(connection.target);


    // Verify that no circular hierarchy occurs
    let current: number | null = parentId;
    while (current !== null) {
        current = tasksSet.getTask(current)?.parentId ?? null;
        if (current === childId) return;
    }

    const task = tasksSet.getTask(childId);
    if (task !== undefined) {
        task.parentId = parentId;
    }

    await api.task.edit({
        id: childId,
        parent_id: parentId,
    });
};

// const onNodeDragStop = async ({ targetNode }: { targetNode: Node | null }) => {
//     if (targetNode === null) return;

//     await api.task.edit({
//         id: Number(targetNode.id),
//         pos_x: targetNode.position.x,
//         pos_y: targetNode.position.y,
//     });
// };

const onDelete: OnDelete = async ({ nodes: deletedNodes }) => {
    for (const node of deletedNodes) {
        const task = tasksSet.getTask(Number(node.id));
        console.log(task);
        if (task === undefined) continue;
        tasksSet.delTask(task);
    }

    await api.task.trash({
        ids: deletedNodes.map(node => Number(node.id)),
    });
};

const onSelectionChange: OnSelectionChange = ({nodes, edges}) => {
    selectedTasks = new Set(
        nodes.values()
            .map(node => tasksSet.getTask(Number(node.id)))
            .filter(task => task !== undefined)
    );
};



onMount(async () => {
    await tasksPromise;

    fitView();
});


let showDone = $state(false);

let selectedTasks = $state.raw(new Set<ReactiveTask>());
const visibleTasks = $state(new SvelteSet<ReactiveTask>());
useTasksSorter({
    tasksSet,
    filterTask: task => showDone || !task.done || selectedTasks.has(task),
    mapTaskToBucket: task => visibleTasks,
});

const tasksGraph = useTasksGraph({
    tasks: visibleTasks,
    tasksSet,
});
</script>


<graph-page>
    <PaneLabel title="tree">
        <options-rack-item>
            <input
                type="checkbox"
                bind:checked={showDone}
            />
            Done tasks
        </options-rack-item>
    </PaneLabel>

    <SvelteFlow
        nodes={tasksGraph.flowNodes}
        edges={tasksGraph.flowEdges}
        fitView
        nodesDraggable={false}
        onconnectstart={onConnectStart}
        onconnectend={onConnectEnd}
        onconnect={onConnect}
        ondelete={onDelete}
        onpanecontextmenu={onPaneContextMenu}
        onpaneclick={onPaneClick}
        onselectionchange={onSelectionChange}
        deleteKey={["Backspace", "Delete"]}
        nodeTypes={{
            task: TaskNode,
        }}
        edgeTypes={{
            ancestry: AncestryEdge,
        }}
    >
        <Background />
        <MiniMap />
    </SvelteFlow>

    <DropdownMenu.Root bind:open={contextMenuOpen}>
        <DropdownMenu.Trigger
            class="context-menu-trigger"
            style="position: fixed; left: {contextMenuPosition.x}px; top: {contextMenuPosition.y}px; visibility: hidden;"
        />
        <DropdownMenu.Content>
            <DropdownMenu.Item onclick={createNewRootTask}>
                New root
            </DropdownMenu.Item>
        </DropdownMenu.Content>
    </DropdownMenu.Root>
</graph-page>

<style lang="scss">
graph-page {
    display: flex;
    flex-direction: column;
}
</style>
