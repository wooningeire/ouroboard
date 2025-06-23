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
	trashed: boolean().notNull().default(false),
}, table => [
	foreignKey({
		columns: [table.parent_id],
		foreignColumns: [table.id],
		name: "parent",
	})
		.onDelete("set null"),
]);

export const taskHoursTable = pgTable("task_hours", {
	id: serial().notNull().primaryKey(),
	created_at: timestamp({withTimezone: true}).notNull().defaultNow(),
	hr_remaining: real().notNull(),
	hr_completed: real().notNull().default(0),
	task_id: integer().notNull().references(() => taskTable.id),
});