import { post } from "$api/endpoint-server";
import { db } from "$db";
import { taskTable } from "$db/schema";


const endpoint = post(async ({
    pos_x,
    pos_y,
    parent_id,
}: {
    pos_x: number,
    pos_y: number,
    parent_id?: number,
}) => {
    const rows = await db.insert(taskTable)
        .values({
            pos_x,
            pos_y,
            parent_id,
        })
        .returning();

    return rows[0];
});

export const POST = endpoint.handler(null);
export type NewTask = typeof endpoint;
