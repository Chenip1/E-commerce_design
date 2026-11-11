import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const projects = sqliteTable('workshop_projects', {
 id: text('id').primaryKey(), owner: text('owner').notNull(),
 payload: text('payload').notNull(), revision: integer('revision').notNull().default(1),
 updatedAt: text('updated_at').notNull()
});
export const brands = sqliteTable('workshop_brands', {
 owner: text('owner').primaryKey(), payload: text('payload').notNull(),
 revision: integer('revision').notNull().default(1)
});

export const styleTemplates = sqliteTable('workshop_style_templates', {
 id: text('id').primaryKey(),
 owner: text('owner').notNull(),
 title: text('title').notNull(),
 prompt: text('prompt').notNull(),
 category: text('category'),
 createdAt: text('created_at').notNull()
});

export const importedSkills = sqliteTable('workshop_imported_skills', {
 owner: text('owner').notNull(),
 source: text('source').notNull(),
 title: text('title').notNull(),
 content: text('content').notNull(),
 updatedAt: text('updated_at').notNull(),
}, table => [primaryKey({ columns: [table.owner, table.source] })]);
