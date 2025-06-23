import { post } from "$api/endpoint-server";
import { db } from "$db";
import { taskTable } from "$db/schema";
import { eq } from "drizzle-orm";


const endpoint = post(async ({
    id,
    title,
    parent_id,
    priority,
}: {
    id: number,
    title?: string,
    parent_id?: number | null,
    priority?: number | null,
}) => {
    const rows = await db.update(taskTable)
        .set({
            title,
            parent_id,
            priority,
        })
        .where(eq(taskTable.id, id))
        .returning();

    return rows[0];
});

export const PATCH = endpoint.handler(null);
export type EditTask = typeof endpoint;
