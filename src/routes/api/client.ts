import { apiGetter, apiPoster } from "./endpoint-client";
import type { ListTasks } from "./task/list/+server";
import type { NewTask } from "./task/new/+server";
import type { EditTask } from "./task/edit/+server";
import type { DeleteTasks } from "./task/delete/+server";
import type { TrashTasks } from "./task/trash/+server";
import type { UpdateHours } from "./task/update-hours/+server";


export const api ={
    task: {
        list: apiGetter<ListTasks>("task/list"),
        new: apiPoster<NewTask>("task/new"),
        edit: apiPoster<EditTask>("task/edit", "PATCH"),
        delete: apiPoster<DeleteTasks>("task/delete", "DELETE"),
        trash: apiPoster<TrashTasks>("task/trash", "PATCH"),
        updateHours: apiPoster<UpdateHours>("task/update-hours"),
    },
};

export type Task = Awaited<ReturnType<typeof api.task.list>>["tasks"][0];