import { get } from "$api/endpoint-server";
import { taskHoursTable, taskTable } from "$db/schema";
import { db } from "$db";
import { asc, desc, eq, not } from "drizzle-orm";

const endpoint = get(async () => {
    const taskHoursLatest = db.select().from(taskHoursTable).as("task_hours_latest");
    const taskHoursOrig = db.select().from(taskHoursTable).as("task_hours_orig");
    const taskData = await db.selectDistinctOn([taskTable.id]).from(taskTable)
        .where(not(taskTable.trashed))
        .leftJoin(taskHoursLatest, eq(taskTable.id, taskHoursLatest.task_id))
        .leftJoin(taskHoursOrig, eq(taskTable.id, taskHoursOrig.task_id))
        .orderBy(taskTable.id, desc(taskHoursLatest.created_at), asc(taskHoursOrig.created_at));

    const tasksSet = new Map<number, typeof taskData[0]>(taskData.map(data => [data.task.id, data]));
    const hasTrashedAncestorResults = new Map<number, boolean>();

    const hasTrashedAncestor = (data: typeof taskData[0]): boolean => {
        const savedResult = hasTrashedAncestorResults.get(data.task.id);
        if (savedResult !== undefined) {
            return savedResult;
        }

        let result: boolean;

        if (data.task.parent_id === null) {
            result = false;
        } else if (!tasksSet.has(data.task.parent_id)) {
            result = true;
        } else {
            result = hasTrashedAncestor(tasksSet.get(data.task.parent_id)!);
        }
        
        hasTrashedAncestorResults.set(data.task.id, result);
        return result;
    };


    // for (const data of taskData) {
    //     if (hasTrashedAncestor(data)) continue;

    //     hoursPromises.push((async () => {
    //         const hoursHistory = await db.select({
    //             created_at: taskHoursTable.created_at,
    //             hr_completed: taskHoursTable.hr_completed,
    //             hr_remaining: taskHoursTable.hr_remaining,
    //         })
    //             .from(taskHoursTable)
    //             .where(eq(taskHoursTable.task_id, data.id))
    //             .orderBy(desc(taskHoursTable.created_at));

    //         return {
    //             ...data,
    //             hoursHistory: hoursHistory.reverse(),
    //         };
    //     })());
    // }

    return {
        tasks: taskData.map(data => ({
            ...data.task,
            hr_completed: data.task_hours_latest?.hr_completed ?? 0,
            hr_remaining: data.task_hours_latest?.hr_remaining ?? 0,
            hr_estimated: (data.task_hours_orig?.hr_completed ?? 0) + (data.task_hours_orig?.hr_remaining ?? 0),
        })),
    };
});

export const GET = endpoint.handler(null);
export type ListTasks = typeof endpoint;