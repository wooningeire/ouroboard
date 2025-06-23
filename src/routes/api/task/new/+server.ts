import { post } from "$api/endpoint-server";
import { db } from "$db";
import { taskHoursTable, taskTable } from "$db/schema";


const endpoint = post(async ({
    parent_id,
}: {
    parent_id?: number,
}) => {
    const taskRows = await db.insert(taskTable)
        .values({
            parent_id,
        })
        .returning();

    const taskHoursRows = await db.insert(taskHoursTable)
        .values({
            task_id: taskRows[0].id,
            hr_remaining: 0,
            hr_completed: 0,
        })
        .returning({
            created_at: taskHoursTable.created_at,
            hr_completed: taskHoursTable.hr_completed,
            hr_remaining: taskHoursTable.hr_remaining,
        });

    return {
        ...taskRows[0],
        hoursHistory: taskHoursRows,
    };
});

export const POST = endpoint.handler(null);
export type NewTask = typeof endpoint;
