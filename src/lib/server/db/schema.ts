import { pgTable, serial, text, integer, timestamp, varchar, time, real, boolean, foreignKey } from "drizzle-orm/pg-core";

export const taskTable = pgTable("task", {
	id: serial().notNull().primaryKey(),
	created_at: timestamp({withTimezone: true}).notNull().defaultNow(),
	title: varchar({length: 256}).notNull().default(""),
	desc: varchar({length: 4096}),
	target_start: timestamp({withTimezone: true}),
	target_end: timestamp({withTimezone: true}),
	hard_end: timestamp({withTimezone: true}),
	priority: integer(),
	clear: boolean().notNull().default(false),
	parent_id: integer(),
	pos_x: real().notNull().default(0),
	pos_y: real().notNull().default(0),
}, table => [
	foreignKey({
		columns: [table.parent_id],
		foreignColumns: [table.id],
		name: "parent",
	}),
]);

export const taskUpdateTable = pgTable("task_update", {
	id: serial().notNull().primaryKey(),
	created_at: timestamp({withTimezone: true}).notNull().defaultNow(),
	hr_remaining: real().notNull(),
	hr_completed: real().notNull().default(0),
	task_id: integer().notNull().references(() => taskTable.id),
});