import { get } from "$api/endpoint-server";
import { taskTable } from "$db/schema";
import { db } from "$db";

const endpoint = get(async () => {
    return {
        tasks: await db.select().from(taskTable),
    };
});

export const GET = endpoint.handler(null);
export type ListTasks = typeof endpoint;