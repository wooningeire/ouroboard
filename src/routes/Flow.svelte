<script lang="ts">
import { Background, MiniMap, SvelteFlow, useSvelteFlow } from "@xyflow/svelte";
import "@xyflow/svelte/dist/style.css";
import "./index.scss";
import type { OnConnectStart, OnConnectEnd, OnConnect, Connection, Node, Edge, NodeEvents } from "@xyflow/svelte";
    import TaskNode from "./TaskNode.svelte";
    import {api} from "$api/client";

// Get access to SvelteFlow instance for coordinate conversion
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
            data: { label: `Task ${task.id}` },
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
    const {id} = await api.task.new({
        pos_x: x,
        pos_y: y,
        parent_id: parentNodeId,
    });

    nodes.push({
        id: id.toString(),
        type: "task",
        position: { x, y }, // Use the actual coordinates passed in
        data: { label: `Task ${id}` },
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

const onConnect: OnConnect = () => {
    lastConnectionDropped = false;
};

const onNodeDragStop: NodeEvents["onnodedragstop"] = async ({ targetNode }) => {
    if (targetNode === null) return;

    await api.task.edit({
        id: Number(targetNode.id),
        pos_x: targetNode.position.x,
        pos_y: targetNode.position.y,
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
    nodeTypes={{
        task: TaskNode,
    }}
>
    <Background />
    <MiniMap />
</SvelteFlow>
