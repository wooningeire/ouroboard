import { get } from "$api/endpoint-server";
import { taskHoursTable, taskTable } from "$db/schema";
import { db } from "$db";
import { desc, eq, not } from "drizzle-orm";

const endpoint = get(async () => {
    const tasks = await db.select().from(taskTable)
        .where(not(taskTable.trashed));

    const hoursPromises = [];

    for (const task of tasks) {
        hoursPromises.push((async () => {
            const hoursHistory = await db.select({
                created_at: taskHoursTable.created_at,
                hr_completed: taskHoursTable.hr_completed,
                hr_remaining: taskHoursTable.hr_remaining,
            })
                .from(taskHoursTable)
                .where(eq(taskHoursTable.task_id, task.id))
                .orderBy(desc(taskHoursTable.created_at));

            return {
                ...task,
                hoursHistory: hoursHistory.reverse(),
            };
        })());
    }

    return {
        tasks: await Promise.all(hoursPromises),
    };
});

export const GET = endpoint.handler(null);
export type ListTasks = typeof endpoint;