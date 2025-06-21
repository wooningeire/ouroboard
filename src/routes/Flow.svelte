<script lang="ts">
import { Background, MiniMap, SvelteFlow, useSvelteFlow } from "@xyflow/svelte";
import "@xyflow/svelte/dist/style.css";
import "./index.scss";
import type { OnConnectStart, OnConnectEnd, OnConnect, OnDelete, Connection, Node, Edge } from "@xyflow/svelte";
import TaskNode from "./TaskNode.svelte";
import { api } from "$api/client";

const { screenToFlowPosition } = useSvelteFlow();

let nodes = $state<Node[]>([]);

let edges = $state<Edge[]>([]);


(async () => {
    const {tasks} = await api.task.list({});

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    for (const task of tasks) {
        newNodes.push({
            id: task.id.toString(),
            type: "task",
            position: {
                x: task.pos_x,
                y: task.pos_y,
            },
            data: task,
        });

        if (task.parent_id !== null) {
            newEdges.push({
                id: `e${task.parent_id}-${task.id}`,
                source: task.parent_id.toString(),
                target: task.id.toString(),
            });
        }
    }

    nodes = newNodes;
    edges = newEdges;
})();


const createNewTask = async (x: number, y: number, parentNodeId: number) => {
    const task = await api.task.new({
        pos_x: x,
        pos_y: y,
        parent_id: parentNodeId,
    });

    nodes.push({
        id: task.id.toString(),
        type: "task",
        position: { x, y },
        data: task,
    });

    edges.push({
        id: `e${parentNodeId}-${task.id}`,
        source: parentNodeId.toString(),
        target: task.id.toString(),
    });
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

        const flowPosition = screenToFlowPosition({ x: screenX, y: screenY });

        createNewTask(flowPosition.x, flowPosition.y, Number(parentNodeId));
    }

    lastConnectionDropped = false;
    parentNodeId = null;
};

const onConnect: OnConnect = async (connection: Connection) => {
    lastConnectionDropped = false;

    await api.task.edit({
        id: Number(connection.target),
        parent_id: Number(connection.source),
    });
};

const onNodeDragStop = async ({ targetNode }: { targetNode: Node | null }) => {
    if (targetNode === null) return;

    await api.task.edit({
        id: Number(targetNode.id),
        pos_x: targetNode.position.x,
        pos_y: targetNode.position.y,
    });
};

const onDelete: OnDelete = async ({ nodes }) => {
    await api.task.trash({
        ids: nodes.map(node => Number(node.id)),
    });
};
</script>

<SvelteFlow
    bind:nodes
    bind:edges
    fitView
    onconnectstart={onConnectStart}
    onconnectend={onConnectEnd}
    onconnect={onConnect}
    onnodedragstop={onNodeDragStop}
    ondelete={onDelete}
    deleteKey={["Backspace", "Delete"]}
    nodeTypes={{
        task: TaskNode,
    }}
>
    <Background />
    <MiniMap />
</SvelteFlow>
