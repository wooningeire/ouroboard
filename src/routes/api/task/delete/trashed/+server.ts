import { post } from "$api/endpoint-server";
import { db } from "$db";
import { taskTable } from "$db/schema";
import { eq } from "drizzle-orm";


const endpoint = post(async () => {
    await db.delete(taskTable)
        .where(
            eq(taskTable.trashed, true),
        );
    
    return {};
});

export const DELETE = endpoint.handler(null);
export type DeleteTrashedTasks = typeof endpoint;
