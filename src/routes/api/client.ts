import { apiGetter, apiPoster } from "./endpoint-client";
import type { ListTasks } from "./task/list/+server";
import type { NewTask } from "./task/new/+server";
import type { EditTask } from "./task/edit/+server";
import type { DeleteTasks } from "./task/delete/+server";
import type { TrashTasks } from "./task/trash/+server";
import type { UpdateHours } from "./task/update-hours/+server";
import type { DeleteTrashedTasks } from "./task/delete/trashed/+server";
import type { NewTaskTimeAllocation } from "./task/time-allocation/new/+server";


export const api = {
    task: {
        list: apiGetter<ListTasks>("task/list"),
        new: apiPoster<NewTask>("task/new"),
        edit: apiPoster<EditTask>("task/edit", "PATCH"),
        delete: apiPoster<DeleteTasks>("task/delete", "DELETE"),
        deleteTrashed: apiPoster<DeleteTrashedTasks>("task/delete/trashed", "DELETE"),
        trash: apiPoster<TrashTasks>("task/trash", "PATCH"),
        updateHours: apiPoster<UpdateHours>("task/update-hours"),
        timeAllocation: {
            new: apiPoster<NewTaskTimeAllocation>("task/time-allocation/new"),
        },
    },
};

export type ApiTask = Awaited<ReturnType<typeof api.task.list>>["tasks"][0];