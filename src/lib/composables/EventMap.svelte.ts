import { SvelteMap } from "svelte/reactivity";
import { useEvent } from "./useEvent.svelte";

export class EventMap<K, V> {
    readonly items = $state(new SvelteMap<K, V>());

    readonly #addEvent = useEvent<[K, V]>();
    readonly #deleteEvent = useEvent<[K, V]>();

    onAdd(fn: (key: K, value: V) => void) {
        this.#addEvent.on(fn);
    }

    onDelete(fn: (key: K, value: V) => void) {
        this.#deleteEvent.on(fn);
    }

    set(key: K, value: V) {
        this.delete(key);
        this.items.set(key, value);

        this.#addEvent.emit(key, value);
    }
    
    delete(key: K) {
        if (!this.has(key)) return;

        const item = this.get(key)!;

        this.items.delete(key);

        this.#deleteEvent.emit(key, item);
    }

    get(key: K) {
        return this.items.get(key);
    }

    has(key: K) {
        return this.items.has(key);
    }

    values() {
        return this.items.values();
    }
}