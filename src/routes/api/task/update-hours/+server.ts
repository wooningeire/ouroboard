import { post } from "$api/endpoint-server";
import { db } from "$db";
import { taskHoursTable } from "$db/schema";
import { and, eq, gt, lt } from "drizzle-orm";

const endpoint = post(async ({
    id,
    hr_completed,
    hr_remaining,
}: {
    id: number,
    hr_completed: number,
    hr_remaining: number,
}) => {
    // Debounce by deleting any updates from the past hour
    await db.delete(taskHoursTable)
        .where(
            and(
                eq(taskHoursTable.task_id, id),
                gt(taskHoursTable.created_at, new Date(Date.now() - 60 * 60 * 1000)),
            )
        );

    const rows = await db.insert(taskHoursTable)
        .values({
            task_id: id,
            hr_completed,
            hr_remaining,
        });
    
    return rows[0];
});

export const POST = endpoint.handler(null);
export type UpdateHours = typeof endpoint;
