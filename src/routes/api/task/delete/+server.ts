import { post } from "$api/endpoint-server";
import { db } from "$db";
import { taskTable } from "$db/schema";
import { eq, or } from "drizzle-orm";


const endpoint = post(async ({
    ids,
}: {
    ids: number[],
}) => {
    await db.delete(taskTable)
        .where(
            or(...ids.map(id => eq(taskTable.id, id)))
        );
});

export const DELETE = endpoint.handler(null);
export type DeleteTask = typeof endpoint;
