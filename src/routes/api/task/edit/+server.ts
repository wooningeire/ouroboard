import { post } from "$api/endpoint-server";
import { db } from "$db";
import { taskTable } from "$db/schema";
import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";


const endpoint = post(async ({
    id,
    title,
    parent_id,
    priority,
    hide_children,
}: {
    id: number,
    title?: string,
    parent_id?: number | null,
    priority?: number | null,
    hide_children?: boolean,
}) => {
    if (parent_id !== undefined && parent_id !== null) {
        let current: number | null = parent_id;
        while (current !== null) {
            const rows = await db.select({parent_id: taskTable.parent_id})
                .from(taskTable)
                .where(eq(taskTable.id, current))
                .limit(1);
            if (rows.length === 0) return error(500, "Task is missing");

            current = rows[0].parent_id;
            if (current === id) return error(400, "Circular hierarchy");
        }
    }

    const rows = await db.update(taskTable)
        .set({
            title,
            parent_id,
            priority,
            hide_children,
        })
        .where(eq(taskTable.id, id))
        .returning();

    return rows[0];
});

export const PATCH = endpoint.handler(null);
export type EditTask = typeof endpoint;
