<script lang="ts">
import { Background, MiniMap, SvelteFlow, useSvelteFlow } from "@xyflow/svelte";
import "@xyflow/svelte/dist/style.css";
import "./index.scss";
import type { OnConnectStart, OnConnectEnd, OnConnect, OnDelete, Connection, Node, Edge } from "@xyflow/svelte";
import TaskNode from "./TaskNode.svelte";
import { api, type Task } from "$api/client";
import { store } from "./store.svelte";
import Dagre from "@dagrejs/dagre";
import { tick } from "svelte";

const { screenToFlowPosition, fitView } = useSvelteFlow();

let nodes = $state<Node<Task>[]>([]);

let edges = $state<Edge[]>([]);


const relayout = (nodes: Node<Task>[], edges: Edge[]) => {
    const graph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    graph.setGraph({ rankdir: "LR" });

    const nodeWidth = 200;
    const nodeHeight = 200;

    for (const edge of edges) {
        graph.setEdge(edge.source, edge.target);
    }
    for (const node of nodes) {
        graph.setNode(node.id, {
            ...node,
            width: nodeWidth,
            height: nodeHeight,
        });
    }

    Dagre.layout(graph);

    return {
        nodes: nodes.map((node) => {
            const position = graph.node(node.id);
            return {
                ...node,
                position: {
                    // We are shifting the dagre node position (anchor=center center) to the top left
                    // so it matches the Svelte Flow node anchor point (top left).
                    x: position.x - nodeWidth / 2,
                    y: position.y - nodeHeight / 2,
                },
            };
        }),
        edges,
    };

};


const createNewTask = async (x: number, y: number, parentNodeId: number) => {
    const task = await api.task.new({
        pos_x: x,
        pos_y: y,
        parent_id: parentNodeId,
    });

    store.tasks.push(task);

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

    ({nodes, edges} = relayout(nodes, edges));
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

    ({nodes, edges} = relayout(nodes, edges));

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

const onDelete: OnDelete = async ({ nodes: deletedNodes }) => {
    ({nodes, edges} = relayout(nodes, edges));

    await api.task.trash({
        ids: deletedNodes.map(node => Number(node.id)),
    });
};


(async () => {
    const {tasks} = await api.task.list({});

    store.tasks = tasks;

    const newNodes: Node<Task>[] = [];
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

    ({nodes, edges} = relayout(newNodes, newEdges));
    await tick();
    ({nodes, edges} = relayout(nodes, edges));
    fitView();
})();

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
