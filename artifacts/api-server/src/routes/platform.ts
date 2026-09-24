import { Router, type IRouter, type Request, type RequestHandler, type Response } from "express";
import { getAuth } from "@clerk/express";
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  sql,
} from "drizzle-orm";
import {
  boardsTable,
  booksTable,
  chaptersTable,
  classesTable,
  citiesTable,
  db,
  recentContentTable,
  rolesTable,
  schoolsTable,
  subjectsTable,
  teacherAssignmentsTable,
  topicsTable,
  usersTable,
} from "@workspace/db";
import {
  CreateAdminEntityBody,
  CreateAdminEntityQueryParams,
  CreateAdminEntityResponse,
  DeleteAdminEntityQueryParams,
  GetCurriculumQueryParams,
  GetCurriculumResponse,
  GetMeResponse,
  GetOnboardingOptionsQueryParams,
  GetOnboardingOptionsResponse,
  GetStudentDashboardResponse,
  GetTeacherDashboardResponse,
  ListAdminEntitiesQueryParams,
  ListAdminEntitiesResponse,
  ListUsersResponse,
  UpdateAdminEntityBody,
  UpdateAdminEntityQueryParams,
  UpdateAdminEntityResponse,
  UpdateMeBody,
  UpdateMeResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

type RoleName = "student" | "teacher" | "admin";
type EntityName = "cities" | "boards" | "schools" | "classes" | "subjects" | "books" | "chapters" | "topics";

const entityNames: EntityName[] = [
  "cities",
  "boards",
  "schools",
  "classes",
  "subjects",
  "books",
  "chapters",
  "topics",
];

const entityTables: Record<EntityName, any> = {
  cities: citiesTable,
  boards: boardsTable,
  schools: schoolsTable,
  classes: classesTable,
  subjects: subjectsTable,
  books: booksTable,
  chapters: chaptersTable,
  topics: topicsTable,
};

const requireAuth: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
};

function getClaims(req: Request): Record<string, unknown> {
  return (getAuth(req).sessionClaims ?? {}) as Record<string, unknown>;
}

function getClaimText(claims: Record<string, unknown>, key: string): string | undefined {
  const value = claims[key];
  return typeof value === "string" ? value : undefined;
}

function getRequestedRole(req: Request, claims: Record<string, unknown>): RoleName {
  const metadata = (claims.publicMetadata ?? claims.metadata) as Record<string, unknown> | undefined;
  if (metadata?.role === "admin") return "admin";
  const email = getClaimText(claims, "email") ?? getClaimText(claims, "email_address");
  if (email && email === (process.env.ADMIN_EMAIL ?? "admin@schoolscope.demo")) return "admin";
  return "student";
}

async function getCurrentUser(req: Request) {
  const auth = getAuth(req);
  if (!auth.userId) return null;
  const existing = await db
    .select({ user: usersTable, roleName: rolesTable.name })
    .from(usersTable)
    .innerJoin(rolesTable, eq(usersTable.roleId, rolesTable.id))
    .where(eq(usersTable.clerkUserId, auth.userId))
    .limit(1);
  if (existing[0]) return { ...existing[0].user, roleName: existing[0].roleName as RoleName };

  const claims = getClaims(req);
  const email =
    getClaimText(claims, "email") ??
    getClaimText(claims, "email_address") ??
    `${auth.userId}@clerk.local`;
  const firstName = getClaimText(claims, "first_name") ?? "";
  const lastName = getClaimText(claims, "last_name") ?? "";
  const name = `${firstName} ${lastName}`.trim() || getClaimText(claims, "name") || "New learner";
  const requestedRole = getRequestedRole(req, claims);
  const [role] = await db.select().from(rolesTable).where(eq(rolesTable.name, requestedRole)).limit(1);
  if (!role) return null;
  const [created] = await db
    .insert(usersTable)
    .values({
      clerkUserId: auth.userId,
      name,
      email,
      roleId: role.id,
    })
    .returning();
  return { ...created, roleName: requestedRole };
}

async function profileForUser(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  const [city] = user.cityId
    ? await db.select({ id: citiesTable.id, name: citiesTable.name }).from(citiesTable).where(eq(citiesTable.id, user.cityId))
    : [];
  const [board] = user.boardId
    ? await db.select({ id: boardsTable.id, name: boardsTable.name }).from(boardsTable).where(eq(boardsTable.id, user.boardId))
    : [];
  const [school] = user.schoolId
    ? await db
        .select({
          id: schoolsTable.id,
          name: schoolsTable.name,
          cityId: schoolsTable.cityId,
          boardId: schoolsTable.boardId,
          cityName: citiesTable.name,
          boardName: boardsTable.name,
        })
        .from(schoolsTable)
        .innerJoin(citiesTable, eq(schoolsTable.cityId, citiesTable.id))
        .innerJoin(boardsTable, eq(schoolsTable.boardId, boardsTable.id))
        .where(eq(schoolsTable.id, user.schoolId))
    : [];
  const [schoolClass] = user.classId
    ? await db.select().from(classesTable).where(eq(classesTable.id, user.classId))
    : [];
  const assignments = user.roleName === "teacher"
    ? await db
        .select({
          classId: teacherAssignmentsTable.classId,
          subjectId: teacherAssignmentsTable.subjectId,
          className: classesTable.name,
          subjectName: subjectsTable.name,
        })
        .from(teacherAssignmentsTable)
        .innerJoin(classesTable, eq(teacherAssignmentsTable.classId, classesTable.id))
        .innerJoin(subjectsTable, eq(teacherAssignmentsTable.subjectId, subjectsTable.id))
        .where(eq(teacherAssignmentsTable.userId, user.id))
    : [];
  return GetMeResponse.parse({
    id: user.id,
    clerkUserId: user.clerkUserId,
    name: user.name,
    email: user.email,
    role: user.roleName,
    city: city ?? null,
    board: board ?? null,
    school: school ?? null,
    class: schoolClass ?? null,
    teacherAssignments: assignments,
    onboardingComplete: user.onboardingComplete,
  });
}

function requireRole(...allowed: RoleName[]): RequestHandler {
  return async (req, res, next) => {
    const user = await getCurrentUser(req);
    if (!user || !allowed.includes(user.roleName)) {
      res.status(403).json({ error: "You do not have access to this area" });
      return;
    }
    next();
  };
}

function parseEntity(value: unknown): EntityName | null {
  return typeof value === "string" && entityNames.includes(value as EntityName)
    ? (value as EntityName)
    : null;
}

function adminEntity(row: any, entity: EntityName) {
  const parentId =
    entity === "schools"
      ? row.cityId
      : entity === "classes"
        ? row.schoolId
        : entity === "subjects"
          ? row.classId
          : entity === "books"
            ? row.subjectId
            : entity === "chapters"
              ? row.bookId
              : entity === "topics"
                ? row.chapterId
                : null;
  const metadata: Record<string, unknown> = {};
  if (entity === "schools") metadata.boardId = row.boardId;
  if (entity === "subjects") {
    metadata.schoolId = row.schoolId;
    metadata.color = row.color;
  }
  if (entity === "books") {
    metadata.classId = row.classId;
    metadata.schoolId = row.schoolId;
    metadata.publisher = row.publisher;
  }
  if (entity === "chapters" || entity === "topics") metadata.orderIndex = row.orderIndex;
  return { id: row.id, name: row.name, parentId: parentId ?? null, metadata };
}

function entityValues(entity: EntityName, data: { name: string; parentId?: number | null; metadata?: Record<string, unknown> }) {
  const metadata = data.metadata ?? {};
  const parentId = data.parentId ?? null;
  const numberValue = (key: string) => typeof metadata[key] === "number" ? metadata[key] : Number(metadata[key]);
  switch (entity) {
    case "cities":
    case "boards":
      return { name: data.name };
    case "schools":
      return { name: data.name, cityId: parentId, boardId: numberValue("boardId") };
    case "classes":
      return { name: data.name, schoolId: parentId };
    case "subjects":
      return { name: data.name, classId: parentId, schoolId: numberValue("schoolId"), color: typeof metadata.color === "string" ? metadata.color : null };
    case "books":
      return { name: data.name, subjectId: parentId, classId: numberValue("classId"), schoolId: numberValue("schoolId"), publisher: typeof metadata.publisher === "string" ? metadata.publisher : null };
    case "chapters":
      return { name: data.name, bookId: parentId, orderIndex: numberValue("orderIndex") || 1 };
    case "topics":
      return { name: data.name, chapterId: parentId, orderIndex: numberValue("orderIndex") || 1 };
  }
}

async function recentForUser(userId: number) {
  return db
    .select({
      topicId: topicsTable.id,
      topicName: topicsTable.name,
      chapterName: chaptersTable.name,
      bookName: booksTable.name,
      subjectName: subjectsTable.name,
      accessedAt: recentContentTable.accessedAt,
    })
    .from(recentContentTable)
    .innerJoin(topicsTable, eq(recentContentTable.topicId, topicsTable.id))
    .innerJoin(chaptersTable, eq(topicsTable.chapterId, chaptersTable.id))
    .innerJoin(booksTable, eq(chaptersTable.bookId, booksTable.id))
    .innerJoin(subjectsTable, eq(booksTable.subjectId, subjectsTable.id))
    .where(eq(recentContentTable.userId, userId))
    .orderBy(desc(recentContentTable.accessedAt))
    .limit(5);
}

const router: IRouter = Router();

router.get("/me", requireAuth, async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.json(await profileForUser(user));
});

router.patch("/me", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const current = await getCurrentUser(req);
  if (!current) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const data = parsed.data;
  const [role] = await db.select().from(rolesTable).where(eq(rolesTable.name, data.role)).limit(1);
  if (!role) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set({
      name: data.name,
      roleId: role.id,
      cityId: data.cityId,
      boardId: data.boardId,
      schoolId: data.schoolId,
      classId: data.classId ?? null,
      onboardingComplete: true,
    })
    .where(eq(usersTable.id, current.id))
    .returning();
  await db.delete(teacherAssignmentsTable).where(eq(teacherAssignmentsTable.userId, current.id));
  if (data.role === "teacher" && data.teacherAssignments?.length) {
    await db.insert(teacherAssignmentsTable).values(
      data.teacherAssignments.map((assignment) => ({
        userId: current.id,
        classId: assignment.classId,
        subjectId: assignment.subjectId,
      })),
    );
  }
  res.json(await profileForUser({ ...updated, roleName: data.role }));
});

router.get("/onboarding/options", async (req, res): Promise<void> => {
  const parsed = GetOnboardingOptionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { cityId, boardId, schoolId } = parsed.data;
  const cities = await db.select({ id: citiesTable.id, name: citiesTable.name }).from(citiesTable).orderBy(asc(citiesTable.name));
  const boards = await db.select({ id: boardsTable.id, name: boardsTable.name }).from(boardsTable).orderBy(asc(boardsTable.name));
  const schools = await db
    .select({
      id: schoolsTable.id,
      name: schoolsTable.name,
      cityId: schoolsTable.cityId,
      boardId: schoolsTable.boardId,
      cityName: citiesTable.name,
      boardName: boardsTable.name,
    })
    .from(schoolsTable)
    .innerJoin(citiesTable, eq(schoolsTable.cityId, citiesTable.id))
    .innerJoin(boardsTable, eq(schoolsTable.boardId, boardsTable.id))
    .where(and(cityId ? eq(schoolsTable.cityId, cityId) : undefined, boardId ? eq(schoolsTable.boardId, boardId) : undefined))
    .orderBy(asc(schoolsTable.name));
  const classes = schoolId
    ? await db.select().from(classesTable).where(eq(classesTable.schoolId, schoolId)).orderBy(asc(classesTable.name))
    : [];
  const subjects = schoolId
    ? await db.select().from(subjectsTable).where(eq(subjectsTable.schoolId, schoolId)).orderBy(asc(subjectsTable.name))
    : [];
  res.json(GetOnboardingOptionsResponse.parse({ cities, boards, schools, classes, subjects }));
});

router.get("/curriculum", async (req, res): Promise<void> => {
  const parsed = GetCurriculumQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { schoolId, classId, subjectId, bookId, chapterId } = parsed.data;
  const classes = await db.select().from(classesTable).where(and(eq(classesTable.schoolId, schoolId), classId ? eq(classesTable.id, classId) : undefined)).orderBy(asc(classesTable.name));
  const subjects = await db.select().from(subjectsTable).where(and(eq(subjectsTable.schoolId, schoolId), classId ? eq(subjectsTable.classId, classId) : undefined, subjectId ? eq(subjectsTable.id, subjectId) : undefined)).orderBy(asc(subjectsTable.name));
  const books = await db.select().from(booksTable).where(and(eq(booksTable.schoolId, schoolId), classId ? eq(booksTable.classId, classId) : undefined, subjectId ? eq(booksTable.subjectId, subjectId) : undefined, bookId ? eq(booksTable.id, bookId) : undefined)).orderBy(asc(booksTable.name));
  const bookIds = books.map((book) => book.id);
  const chapters = bookIds.length
    ? await db.select().from(chaptersTable).where(and(inArray(chaptersTable.bookId, bookIds), chapterId ? eq(chaptersTable.id, chapterId) : undefined)).orderBy(asc(chaptersTable.orderIndex))
    : [];
  const chapterIds = chapters.map((chapter) => chapter.id);
  const topics = chapterIds.length
    ? await db.select().from(topicsTable).where(inArray(topicsTable.chapterId, chapterIds)).orderBy(asc(topicsTable.orderIndex))
    : [];
  res.json(GetCurriculumResponse.parse({ classes, subjects, books, chapters, topics }));
});

router.get("/dashboard/student", requireAuth, requireRole("student"), async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const profile = await profileForUser(user);
  const subjects = user.schoolId
    ? await db.select().from(subjectsTable).where(and(eq(subjectsTable.schoolId, user.schoolId), user.classId ? eq(subjectsTable.classId, user.classId) : undefined)).orderBy(asc(subjectsTable.name))
    : [];
  const [topicCount] = user.schoolId
    ? await db.select({ value: count() }).from(topicsTable).innerJoin(chaptersTable, eq(topicsTable.chapterId, chaptersTable.id)).innerJoin(booksTable, eq(chaptersTable.bookId, booksTable.id)).where(eq(booksTable.schoolId, user.schoolId))
    : [{ value: 0 }];
  res.json(GetStudentDashboardResponse.parse({ profile, subjects, recentContent: await recentForUser(user.id), topicCount: Number(topicCount.value) }));
});

router.get("/dashboard/teacher", requireAuth, requireRole("teacher"), async (req, res): Promise<void> => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const profile = await profileForUser(user);
  const assignments = profile.teacherAssignments;
  const [topicCount] = user.schoolId
    ? await db.select({ value: count() }).from(topicsTable).innerJoin(chaptersTable, eq(topicsTable.chapterId, chaptersTable.id)).innerJoin(booksTable, eq(chaptersTable.bookId, booksTable.id)).where(eq(booksTable.schoolId, user.schoolId))
    : [{ value: 0 }];
  res.json(GetTeacherDashboardResponse.parse({ profile, assignments, recentActivity: await recentForUser(user.id), topicCount: Number(topicCount.value) }));
});

router.get("/admin/users", requireAuth, requireRole("admin"), async (_req, res): Promise<void> => {
  const rows = await db
    .select({ user: usersTable, roleName: rolesTable.name })
    .from(usersTable)
    .innerJoin(rolesTable, eq(usersTable.roleId, rolesTable.id));
  const profiles = await Promise.all(rows.map((row) => profileForUser({ ...row.user, roleName: row.roleName as RoleName })));
  res.json(ListUsersResponse.parse(profiles));
});

router.get("/admin", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = ListAdminEntitiesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const entity = parseEntity(parsed.data.entity);
  if (!entity) {
    res.status(400).json({ error: "Unknown curriculum entity" });
    return;
  }
  const table = entityTables[entity];
  const rows = await db.select().from(table).orderBy(asc(table.name));
  res.json(ListAdminEntitiesResponse.parse(rows.map((row: any) => adminEntity(row, entity))));
});

router.post("/admin", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = CreateAdminEntityQueryParams.safeParse(req.query);
  const body = CreateAdminEntityBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: !params.success ? params.error.message : body.error.message });
    return;
  }
  const entity = parseEntity(params.data.entity);
  if (!entity) {
    res.status(400).json({ error: "Unknown curriculum entity" });
    return;
  }
  const [created] = await db.insert(entityTables[entity]).values(entityValues(entity, body.data)).returning();
  res.status(201).json(CreateAdminEntityResponse.parse(adminEntity(created, entity)));
});

router.patch("/admin", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateAdminEntityQueryParams.safeParse(req.query);
  const body = UpdateAdminEntityBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: !params.success ? params.error.message : body.error.message });
    return;
  }
  const entity = parseEntity(params.data.entity);
  if (!entity) {
    res.status(400).json({ error: "Unknown curriculum entity" });
    return;
  }
  const [updated] = await db.update(entityTables[entity]).set(entityValues(entity, body.data)).where(eq(entityTables[entity].id, params.data.id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Curriculum record not found" });
    return;
  }
  res.json(UpdateAdminEntityResponse.parse(adminEntity(updated, entity)));
});

router.delete("/admin", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const params = DeleteAdminEntityQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const entity = parseEntity(params.data.entity);
  if (!entity) {
    res.status(400).json({ error: "Unknown curriculum entity" });
    return;
  }
  const [deleted] = await db.delete(entityTables[entity]).where(eq(entityTables[entity].id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Curriculum record not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;