import { post } from "$api/endpoint-server";
import { db } from "$db";
import { taskTable } from "$db/schema";
import { eq } from "drizzle-orm";


const endpoint = post(async ({
    id,
    pos_x,
    pos_y,
    title,
    parent_id,
}: {
    id: number,
    pos_x?: number,
    pos_y?: number,
    title?: string,
    parent_id?: number | null,
}) => {
    const rows = await db.update(taskTable)
        .set({
            pos_x,
            pos_y,
            title,
            parent_id,
        })
        .where(eq(taskTable.id, id))
        .returning();

    return rows[0];
});

export const PATCH = endpoint.handler(null);
export type EditTask = typeof endpoint;
