import { onDestroy, onMount } from "svelte";

export const useEvent = <T extends any[]>() => {
    type Handler = (...args: T) => void;

    const handlers = new Set<Handler>();

    return {
        on: (handler: Handler) => {
            onMount(() => {
                handlers.add(handler);
            });

            onDestroy(() => {
                handlers.delete(handler);
            });
        },

        emit: (...args: T) => {
            for (const handler of handlers) {
                handler(...args);
            }
        }
    }
};