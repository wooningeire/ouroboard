import { apiGetter, apiPoster } from "./endpoint-client";
import type { ListTasks } from "./task/list/+server";
import type { NewTask } from "./task/new/+server";
import type { EditTask } from "./task/edit/+server";
import type { DeleteTask } from "./task/delete/+server";


export const api ={
    task: {
        list: apiGetter<ListTasks>("task/list"),
        new: apiPoster<NewTask>("task/new"),
        edit: apiPoster<EditTask>("task/edit", "PATCH"),
        delete: apiPoster<DeleteTask>("task/delete", "DELETE"),
    },
};