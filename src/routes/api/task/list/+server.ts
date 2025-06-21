import { get } from "$api/endpoint-server";
import { taskTable } from "$db/schema";
import { db } from "$db";
import { not } from "drizzle-orm";

const endpoint = get(async () => {
    return {
        tasks: await db.select().from(taskTable)
            .where(not(taskTable.trashed)),
    };
});

export const GET = endpoint.handler(null);
export type ListTasks = typeof endpoint;