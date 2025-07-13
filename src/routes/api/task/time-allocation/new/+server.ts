import { post } from "$api/endpoint-server";
import { db } from "$db";
import { taskTimeAllocationTable } from "$db/schema";


const endpoint = post(async ({
    task_id,
    target_n_hours_spent,
    target_start,
    target_end,
}: {
    task_id: number,
    target_n_hours_spent: number,
    target_start?: Date | null,
    target_end?: Date | null,
}) => {
    const taskTimeAllocationRows = await db.insert(taskTimeAllocationTable)
        .values({
            task_id,
            target_n_hours_spent,
            target_start,
            target_end
        })
        .returning();

    return {
        allocation: taskTimeAllocationRows[0],
    };
});

export const POST = endpoint.handler(null);
export type NewTaskTimeAllocation = typeof endpoint;
