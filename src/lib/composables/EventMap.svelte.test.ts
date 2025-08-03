import { describe, expect, it } from "vitest";
import { EventMap } from "./EventMap.svelte";
import { page } from '@vitest/browser/context';
import { render } from 'vitest-browser-svelte';
import Dummy from './Dummy.svelte';

describe("./EventMap.test.svelte", () => {
	it('should render h1', async () => {
		render(Dummy, {
            run: () => {},
        });
		
		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
	});
});

describe(EventMap.name, () => {
    const populate = (map: EventMap<number, string | undefined>) => {
        map.set(0, "wyvern");
        map.set(1, "amphitheater");
        map.delete(1);
        map.set(1, "amphithere");
        map.set(2, "zmei");
        map.set(2, "dragon");
        map.set(2, "knucker");
        map.set(5, undefined);
    };

    describe(EventMap.prototype.has.name, () => {
        it("returns true if a key is present", () => {
            const map = new EventMap<number, string | undefined>();
            populate(map);

            expect(map.has(0)).toBe(true);
            expect(map.has(1)).toBe(true);
            expect(map.has(2)).toBe(true);
            expect(map.has(5)).toBe(true);
        });

        it("returns false if a key is absent", () => {
            const map = new EventMap<number, string | undefined>();
            populate(map);

            expect(map.has(3)).toBe(false);
            expect(map.has(-1)).toBe(false);
            expect(map.has(7)).toBe(false);
        });
    });

    describe(EventMap.prototype.get.name, () => {
        it("returns the value if the key is present", () => {
            const map = new EventMap<number, string | undefined>();
            populate(map);

            expect(map.get(0)).toBe("wyvern");
            expect(map.get(1)).toBe("amphithere");
            expect(map.get(2)).toBe("knucker");
            expect(map.get(5)).toBeUndefined();
        });

        it("returns undefined if the key is absent", () => {
            const map = new EventMap<number, string | undefined>();
            populate(map);

            expect(map.get(3)).toBeUndefined();
            expect(map.get(-1)).toBeUndefined();
            expect(map.get(7)).toBeUndefined();
        });
    });

    describe(EventMap.prototype.onAdd.name, () => {
        it("emits whenever a value is set", () => {
            let nInsertions = 0;

            render(Dummy, {
                run: () => {
                    const map = new EventMap<number, string | undefined>();
                    map.onAdd(() => nInsertions++);
                    populate(map);
                },
            });

            expect(nInsertions).toBe(7);
        });

        it("emits the correctly added items", () => {
            const items: [number, string | undefined][] = [];

            render(Dummy, {
                run: () => {
                    const map = new EventMap<number, string | undefined>();
                    map.onAdd((key, value) => items.push([key, value]));
                    populate(map);
                },
            });
            
            expect(items).toEqual([
                [0, "wyvern"],
                [1, "amphitheater"],
                [1, "amphithere"],
                [2, "zmei"],
                [2, "dragon"],
                [2, "knucker"],
                [5, undefined],
            ]);
        });
    });

    describe(EventMap.prototype.onDelete.name, () => {
        it("emits whenever a value is removed or overwritten", () => {
            let nDeletions = 0;

            render(Dummy, {
                run: () => {
                    const map = new EventMap<number, string | undefined>();
                    map.onDelete(() => nDeletions++);
                    populate(map);
                },
            });

            expect(nDeletions).toBe(3);
        });

        it("emits the correctly deleted items", () => {
            const items: [number, string | undefined][] = [];

            render(Dummy, {
                run: () => {
                    const map = new EventMap<number, string | undefined>();
                    map.onDelete((key, value) => items.push([key, value]));
                    populate(map);
                },
            });
            
            expect(items).toEqual([
                [1, "amphitheater"],
                [2, "zmei"],
                [2, "dragon"],
            ]);
        });
    });
});
