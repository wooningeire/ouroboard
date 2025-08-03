import type { Edge, Node } from "@xyflow/svelte";
import type { Task } from "./Task.svelte";

export class GraphTask {
    readonly task: Task = $state()!;

    readonly elDimensions = $state({
        width: 0,
        height: 0,
    });

    readonly flowNode: Node<Record<string, any>> = $derived({
        id: this.task.id.toString(),
        type: "task",
        position: this.task.pos,
        data: this,
    });
    
    readonly flowEdge: Edge | null = $derived.by(() => {
        if (this.task.parentId === null) return null;
        
        return {
            id: `e${this.task.parentId}-${this.task.id}`,
            type: "ancestry",
            source: this.task.parentId.toString(),
            target: this.task.id.toString(),
        };
    });

    constructor(task: Task) {
        this.task = task;
    }
}