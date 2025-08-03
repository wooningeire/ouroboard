import { pgTable, serial, text, integer, timestamp, varchar, time, real, boolean, foreignKey, primaryKey } from "drizzle-orm/pg-core";

export const taskTable = pgTable("task", {
	id: serial().notNull().primaryKey(),
	created_at: timestamp({withTimezone: true}).notNull().defaultNow(),
	title: varchar({length: 256}).notNull().default(""),
	desc: varchar({length: 4096}),
	hard_end: timestamp({withTimezone: true}),
	priority: integer(),
	parent_id: integer(),
	clear: boolean().notNull().default(false),
	trashed: boolean().notNull().default(false),
	hide_children: boolean().notNull().default(false),
	always_expanded: boolean().notNull().default(false),
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
	task_id: integer().notNull(),
}, table => [
	foreignKey({
		columns: [table.task_id],
		foreignColumns: [taskTable.id],
		name: "task",
	})
		.onDelete("cascade"),
]);

export const taskTimeAllocationTable = pgTable("task_time_allocation", {
	id: serial().notNull().primaryKey(),
	task_id: integer().notNull(),
	target_start: timestamp({withTimezone: true}),
	target_end: timestamp({withTimezone: true}),
	target_n_hours_spent: integer().notNull(),
}, table => [
	foreignKey({
		columns: [table.task_id],
		foreignColumns: [taskTable.id],
		name: "task",
	})
		.onDelete("cascade"),
]);

export const tagTable = pgTable("tag", {
	id: serial().notNull().primaryKey(),
	name: varchar({length: 256}).notNull(),
});

export const taskTagTable = pgTable("task_tag", {
	task_id: integer().notNull(),
	tag_id: integer().notNull(),
}, table => [
	primaryKey({ columns: [table.task_id, table.tag_id] }),

	foreignKey({
		columns: [table.task_id],
		foreignColumns: [taskTable.id],
		name: "task",
	})
		.onDelete("cascade"),

	foreignKey({
		columns: [table.tag_id],
		foreignColumns: [tagTable.id],
		name: "tag",
	})
		.onDelete("cascade"),
]);
