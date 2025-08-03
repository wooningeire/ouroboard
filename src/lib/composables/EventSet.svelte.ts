import { SvelteSet } from "svelte/reactivity";
import { useEvent } from "./useEvent.svelte";

export class EventSet<T> {
    readonly items = $state(new SvelteSet<T>());

    readonly #addEvent = useEvent<[T]>();
    readonly #deleteEvent = useEvent<[T]>();

    onAdd(fn: (item: T) => void) {
        this.#addEvent.on(fn);
    }

    onDelete(fn: (item: T) => void) {
        this.#deleteEvent.on(fn);
    }

    add(item: T) {
        this.items.add(item);

        this.#addEvent.emit(item);
    }
    
    delete(item: T) {
        this.items.delete(item);

        this.#deleteEvent.emit(item);
    }

    has(item: T) {
        return this.items.has(item);
    }
}