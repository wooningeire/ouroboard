import { get } from "$api/endpoint-server";
import { taskHoursTable, taskTable } from "$db/schema";
import { db } from "$db";
import { desc, eq, not } from "drizzle-orm";

const endpoint = get(async () => {
    const tasks = await db.select().from(taskTable)
        .where(not(taskTable.trashed));

    const tasksSet = new Map<number, typeof tasks[0]>(tasks.map(task => [task.id, task]));
    const hasTrashedAncestorResults = new Map<number, boolean>();

    const hasTrashedAncestor = (task: typeof tasks[0]): boolean => {
        const savedResult = hasTrashedAncestorResults.get(task.id);
        if (savedResult !== undefined) {
            return savedResult;
        }

        let result: boolean;

        if (task.parent_id === null) {
            result = false;
        } else if (!tasksSet.has(task.parent_id)) {
            result = true;
        } else {
            result = hasTrashedAncestor(tasksSet.get(task.parent_id)!);
        }
        
        hasTrashedAncestorResults.set(task.id, result);
        return result;
    };


    const hoursPromises = [];

    for (const task of tasks) {
        if (hasTrashedAncestor(task)) continue;

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