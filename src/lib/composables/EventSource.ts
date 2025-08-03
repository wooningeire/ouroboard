import { onDestroy } from "svelte";

export type Handler<T extends any[]> = (...args: T) => void;

export class EventSource<T extends any[]> {
    #handlers = new Set<Handler<T>>();

    on(handler: Handler<T>) {
        this.#handlers.add(handler);

        onDestroy(() => {
            this.#handlers.delete(handler);
        });
    }

    emit(...args: T) {
        for (const handler of this.#handlers) {
            handler(...args);
        }
    }
};