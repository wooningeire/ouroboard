import type { api } from "$api/client";

export const store = $state({
    tasks: <Awaited<ReturnType<typeof api.task.list>>["tasks"][0][]>[],
});