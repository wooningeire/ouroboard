import { post } from "$api/endpoint-server";
import { db } from "$db";
import { taskTable } from "$db/schema";
import { eq, or } from "drizzle-orm";

const endpoint = post(async ({
    ids,
}: {
    ids: number[],
}) => {
    await db.update(taskTable)
        .set({
            trashed: true,
        })
        .where(
            or(...ids.map(id => eq(taskTable.id, id)))
        );
    
    return {};
});

export const PATCH = endpoint.handler(null);
export type TrashTasks = typeof endpoint;
