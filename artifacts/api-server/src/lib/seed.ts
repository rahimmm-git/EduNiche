import { db } from "@workspace/db";
import {
  boardsTable,
  booksTable,
  chaptersTable,
  classesTable,
  citiesTable,
  rolesTable,
  schoolsTable,
  subjectsTable,
  topicsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export async function ensureSeedData(): Promise<void> {
  const existingCities = await db.select({ id: citiesTable.id }).from(citiesTable).limit(1);
  if (existingCities.length > 0) return;

  const roles = await Promise.all(
    ["student", "teacher", "admin"].map(async (name) => {
      const [role] = await db.insert(rolesTable).values({ name }).returning();
      return role;
    }),
  );
  const roleNames = roles.map((role) => role.name).join(", ");
  const [delhi] = await db.insert(citiesTable).values({ name: "New Delhi" }).returning();
  const [pune] = await db.insert(citiesTable).values({ name: "Pune" }).returning();
  const [bengaluru] = await db.insert(citiesTable).values({ name: "Bengaluru" }).returning();
  const [cbse] = await db.insert(boardsTable).values({ name: "CBSE" }).returning();
  const [icse] = await db.insert(boardsTable).values({ name: "ICSE" }).returning();

  const [springfield] = await db
    .insert(schoolsTable)
    .values({ name: "Springfield Public School", cityId: delhi.id, boardId: cbse.id })
    .returning();
  await db
    .insert(schoolsTable)
    .values({ name: "Oakridge Academy", cityId: pune.id, boardId: cbse.id })
    .returning();
  await db
    .insert(schoolsTable)
    .values({ name: "The Heritage School", cityId: bengaluru.id, boardId: icse.id })
    .returning();

  const [classNine] = await db
    .insert(classesTable)
    .values({ name: "Class 9", schoolId: springfield.id })
    .returning();
  await db.insert(classesTable).values({ name: "Class 10", schoolId: springfield.id }).returning();

  const subjectRows = await db
    .insert(subjectsTable)
    .values([
      { name: "Mathematics", schoolId: springfield.id, classId: classNine.id, color: "#5B5CE2" },
      { name: "Science", schoolId: springfield.id, classId: classNine.id, color: "#0D9488" },
      { name: "English", schoolId: springfield.id, classId: classNine.id, color: "#D97706" },
      { name: "Social Science", schoolId: springfield.id, classId: classNine.id, color: "#C2410C" },
    ])
    .returning();

  const books = await db
    .insert(booksTable)
    .values([
      {
        name: "Mathematics — Class 9",
        subjectId: subjectRows[0].id,
        classId: classNine.id,
        schoolId: springfield.id,
        publisher: "NCERT",
      },
      {
        name: "Science — Class 9",
        subjectId: subjectRows[1].id,
        classId: classNine.id,
        schoolId: springfield.id,
        publisher: "NCERT",
      },
      {
        name: "Beehive",
        subjectId: subjectRows[2].id,
        classId: classNine.id,
        schoolId: springfield.id,
        publisher: "NCERT",
      },
      {
        name: "India and the Contemporary World",
        subjectId: subjectRows[3].id,
        classId: classNine.id,
        schoolId: springfield.id,
        publisher: "NCERT",
      },
    ])
    .returning();

  const chapters = await db
    .insert(chaptersTable)
    .values([
      { name: "Number Systems", bookId: books[0].id, orderIndex: 1 },
      { name: "Polynomials", bookId: books[0].id, orderIndex: 2 },
      { name: "Matter in Our Surroundings", bookId: books[1].id, orderIndex: 1 },
      { name: "The Fundamental Unit of Life", bookId: books[1].id, orderIndex: 2 },
      { name: "The Fun They Had", bookId: books[2].id, orderIndex: 1 },
      { name: "The French Revolution", bookId: books[3].id, orderIndex: 1 },
    ])
    .returning();

  await db.insert(topicsTable).values([
    { name: "Rational and Irrational Numbers", chapterId: chapters[0].id, orderIndex: 1 },
    { name: "Laws of Exponents", chapterId: chapters[0].id, orderIndex: 2 },
    { name: "Real Numbers on the Number Line", chapterId: chapters[0].id, orderIndex: 3 },
    { name: "Introduction to Polynomials", chapterId: chapters[1].id, orderIndex: 1 },
    { name: "Physical Nature of Matter", chapterId: chapters[2].id, orderIndex: 1 },
    { name: "Changes Around Us", chapterId: chapters[2].id, orderIndex: 2 },
    { name: "Cell: The Fundamental Unit", chapterId: chapters[3].id, orderIndex: 1 },
    { name: "Cell Organelles", chapterId: chapters[3].id, orderIndex: 2 },
    { name: "Reading and Comprehension", chapterId: chapters[4].id, orderIndex: 1 },
    { name: "Historical Context", chapterId: chapters[5].id, orderIndex: 1 },
  ]);

  logger.info({ roles: roleNames, seededSchool: springfield.name }, "Seeded demo curriculum");
  void eq;
}