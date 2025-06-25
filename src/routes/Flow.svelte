<script lang="ts">
import { Background, MiniMap, SvelteFlow, useSvelteFlow } from "@xyflow/svelte";
import "@xyflow/svelte/dist/style.css";
import "./index.scss";
import type { OnConnectStart, OnConnectEnd, OnConnect, OnDelete, Connection, Node, Edge } from "@xyflow/svelte";
import TaskNode from "./TaskNode.svelte";
import { api } from "$api/client";
import * as store from "./store.svelte";
import { onMount, tick } from "svelte";
import * as DropdownMenu from "@/ui/dropdown-menu";
import AncestryEdge from "./AncestryEdge.svelte";

const { fitView } = useSvelteFlow();

const nodes = $derived(store.getFlowNodes());
const edges = $derived(store.getFlowEdges());

let contextMenuOpen = $state(false);
let contextMenuPosition = $state({ x: 0, y: 0 });

const createNewTask = async (parentNodeId: number | null=null) => {
    const placeholderTask = $state({
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
        hidden: false,
        hoursHistory: [{
            created_at: new Date(),
            hr_completed: 0,
            hr_remaining: 0,
        }],
    });

    store.addTask(placeholderTask);
    store.animateNodePositions();

    const task = await api.task.new({
        parent_id: parentNodeId,
    });

    store.delTask(placeholderTask);
    Object.assign(placeholderTask, task);
    store.addTask(placeholderTask);
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
        let screenX: number;
        let screenY: number;

        if (event instanceof MouseEvent) {
            screenX = event.clientX;
            screenY = event.clientY;
        } else if (event instanceof TouchEvent && event.changedTouches.length > 0) {
            screenX = event.changedTouches[0].clientX;
            screenY = event.changedTouches[0].clientY;
        } else {
            screenX = 0;
            screenY = 0;
        }

        createNewTask(Number(parentNodeId));
    }

    lastConnectionDropped = false;
    parentNodeId = null;
};

const onConnect: OnConnect = async (connection: Connection) => {
    lastConnectionDropped = false;

    const parentId = Number(connection.source);
    const childId = Number(connection.target);

    const task = store.getTask(childId);
    if (task !== undefined) {
        store.setNewTaskParent(task.task, parentId);
    }
    store.animateNodePositions();

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
        const task = store.getTask(Number(node.id));
        if (task === undefined) continue;
        store.delTask(task.task);
    }
    store.animateNodePositions();

    await api.task.trash({
        ids: deletedNodes.map(node => Number(node.id)),
    });
};


onMount(async () => {
    const {tasks} = await api.task.list({});

    store.initializeTasks(tasks);
    store.animateNodePositions();

    await tick();

    fitView();
});
</script>

<SvelteFlow
    {nodes}
    {edges}
    fitView
    nodesDraggable={false}
    onconnectstart={onConnectStart}
    onconnectend={onConnectEnd}
    onconnect={onConnect}
    ondelete={onDelete}
    onpanecontextmenu={onPaneContextMenu}
    onpaneclick={onPaneClick}
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
