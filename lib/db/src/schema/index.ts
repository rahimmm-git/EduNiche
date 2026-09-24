import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rolesTable = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const citiesTable = pgTable(
  "cities",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("cities_name_unique").on(table.name)],
);

export const boardsTable = pgTable(
  "boards",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("boards_name_unique").on(table.name)],
);

export const schoolsTable = pgTable(
  "schools",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    cityId: integer("city_id").notNull().references(() => citiesTable.id, { onDelete: "cascade" }),
    boardId: integer("board_id").notNull().references(() => boardsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("schools_city_board_idx").on(table.cityId, table.boardId),
    uniqueIndex("schools_name_city_board_unique").on(table.name, table.cityId, table.boardId),
  ],
);

export const classesTable = pgTable(
  "classes",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    schoolId: integer("school_id").notNull().references(() => schoolsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("classes_school_name_unique").on(table.schoolId, table.name)],
);

export const subjectsTable = pgTable(
  "subjects",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    schoolId: integer("school_id").notNull().references(() => schoolsTable.id, { onDelete: "cascade" }),
    classId: integer("class_id").notNull().references(() => classesTable.id, { onDelete: "cascade" }),
    color: text("color"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("subjects_school_class_idx").on(table.schoolId, table.classId)],
);

export const booksTable = pgTable(
  "books",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    subjectId: integer("subject_id").notNull().references(() => subjectsTable.id, { onDelete: "cascade" }),
    classId: integer("class_id").notNull().references(() => classesTable.id, { onDelete: "cascade" }),
    schoolId: integer("school_id").notNull().references(() => schoolsTable.id, { onDelete: "cascade" }),
    publisher: text("publisher"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("books_curriculum_idx").on(table.schoolId, table.classId, table.subjectId)],
);

export const chaptersTable = pgTable(
  "chapters",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    bookId: integer("book_id").notNull().references(() => booksTable.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("chapters_book_order_idx").on(table.bookId, table.orderIndex)],
);

export const topicsTable = pgTable(
  "topics",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    chapterId: integer("chapter_id").notNull().references(() => chaptersTable.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("topics_chapter_order_idx").on(table.chapterId, table.orderIndex)],
);

export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    roleId: integer("role_id").notNull().references(() => rolesTable.id),
    cityId: integer("city_id").references(() => citiesTable.id, { onDelete: "set null" }),
    boardId: integer("board_id").references(() => boardsTable.id, { onDelete: "set null" }),
    schoolId: integer("school_id").references(() => schoolsTable.id, { onDelete: "set null" }),
    classId: integer("class_id").references(() => classesTable.id, { onDelete: "set null" }),
    onboardingComplete: boolean("onboarding_complete").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("users_clerk_id_unique").on(table.clerkUserId),
    index("users_role_idx").on(table.roleId),
  ],
);

export const teacherAssignmentsTable = pgTable(
  "teacher_assignments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    classId: integer("class_id").notNull().references(() => classesTable.id, { onDelete: "cascade" }),
    subjectId: integer("subject_id").notNull().references(() => subjectsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("teacher_assignment_unique").on(table.userId, table.classId, table.subjectId),
    index("teacher_assignments_user_idx").on(table.userId),
  ],
);

export const recentContentTable = pgTable(
  "recent_content",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    topicId: integer("topic_id").notNull().references(() => topicsTable.id, { onDelete: "cascade" }),
    accessedAt: timestamp("accessed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("recent_content_user_accessed_idx").on(table.userId, table.accessedAt)],
);

export const entityMetadata = jsonb("metadata").$type<Record<string, unknown>>().default({});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCitySchema = createInsertSchema(citiesTable).omit({ id: true, createdAt: true });
export const insertBoardSchema = createInsertSchema(boardsTable).omit({ id: true, createdAt: true });
export const insertSchoolSchema = createInsertSchema(schoolsTable).omit({ id: true, createdAt: true });
export const insertClassSchema = createInsertSchema(classesTable).omit({ id: true, createdAt: true });
export const insertSubjectSchema = createInsertSchema(subjectsTable).omit({ id: true, createdAt: true });
export const insertBookSchema = createInsertSchema(booksTable).omit({ id: true, createdAt: true });
export const insertChapterSchema = createInsertSchema(chaptersTable).omit({ id: true, createdAt: true });
export const insertTopicSchema = createInsertSchema(topicsTable).omit({ id: true, createdAt: true });
export const insertTeacherAssignmentSchema = createInsertSchema(teacherAssignmentsTable).omit({ id: true, createdAt: true });

export type User = typeof usersTable.$inferSelect;
export type City = typeof citiesTable.$inferSelect;
export type Board = typeof boardsTable.$inferSelect;
export type School = typeof schoolsTable.$inferSelect;
export type SchoolClass = typeof classesTable.$inferSelect;
export type Subject = typeof subjectsTable.$inferSelect;
export type Book = typeof booksTable.$inferSelect;
export type Chapter = typeof chaptersTable.$inferSelect;
export type Topic = typeof topicsTable.$inferSelect;
export type TeacherAssignment = typeof teacherAssignmentsTable.$inferSelect;