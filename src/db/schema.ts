/**
 * Schema de Base de Datos — CONECTA
 *
 * Tablas principales:
 * - users: Autenticación y gestión de cuentas
 * - graduates: Perfiles profesionales de egresados
 * - connections: Sistema de conexiones/amistades
 * - user_posts: Publicaciones del feed de actividad
 * - post_comments: Comentarios en publicaciones
 * - post_reactions: Reacciones (👍❤️🎉💡) en posts
 * - admin_posts: Noticias publicadas por admins/editors
 * - events: Eventos (webinars, encuentros)
 * - event_attendees: Asistentes confirmados a eventos
 * - event_notification_log: Log de notificaciones automáticas de eventos
 * - groups: Comunidades/grupos temáticos
 * - group_members: Miembros de cada grupo
 * - group_posts: Publicaciones dentro de grupos
 * - notifications: Notificaciones del sistema
 * - email_lists: Listas de correo (gestión administrativa)
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  graduateId: integer("graduate_id"),
  role: text("role", { enum: ["user", "admin", "institution", "editor"] }).notNull().default("user"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  institutionName: text("institution_name"), // Para rol "institution"
  pendingUniversity: text("pending_university"), // Universidad seleccionada al registrarse
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const graduates = sqliteTable("graduates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  memberType: text("member_type", { enum: ["teacher", "researcher", "specialist", "technician", "administrative", "manager", "staff", "student", "graduate", "collaborator", "unspecified"] }).notNull().default("unspecified"),
  employmentConfirmed: integer("employment_confirmed", { mode: "boolean" }).notNull().default(false),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  country: text("country").notNull(),
  city: text("city"),
  university: text("university").notNull(),
  career: text("career").notNull(),
  graduationYear: integer("graduation_year").notNull(),
  currentProfession: text("current_profession").notNull(),
  currentCompany: text("current_company"),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  phone: text("phone"),
  linkedin: text("linkedin"),
  skills: text("skills"),
  languages: text("languages"),
  interests: text("interests"),
  website: text("website"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// Lista de universidades cubanas
export const UNIVERSITIES = [
  "Universidad de La Habana",
  "Universidad de Oriente",
  "Universidad Central de Las Villas",
  "Universidad Marta Abreu de Las Villas",
  "Universidad de Camagüey",
  "Universidad de Pinar del Río",
  "Universidad de Holguín",
  "Universidad de Granma",
  "Universidad de Sancti Spíritus",
  "Universidad de Matanzas",
  "Instituto Superior Politécnico José Antonio Echeverría (CUJAE)",
  "Universidad de Ciencias Médicas de La Habana",
  "Escuela Internacional de Educación Física y Deportes",
  "Instituto Superior de Arte",
  "Universidad de las Ciencias Informáticas",
];

export const connections = sqliteTable("connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  senderId: integer("sender_id")
    .notNull()
    .references(() => graduates.id),
  receiverId: integer("receiver_id")
    .notNull()
    .references(() => graduates.id),
  status: text("status", { enum: ["pending", "accepted", "rejected"] })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  graduateId: integer("graduate_id")
    .notNull()
    .references(() => graduates.id),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const emailLists = sqliteTable("email_lists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  filterUniversity: text("filter_university"),
  filterCareer: text("filter_career"),
  filterCountry: text("filter_country"),
  filterYearFrom: integer("filter_year_from"),
  filterYearTo: integer("filter_year_to"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const adminPosts = sqliteTable("admin_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  authorName: text("author_name").notNull(),
  authorId: integer("author_id").references(() => users.id),
  pinnedUntil: integer("pinned_until"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const postReactions = sqliteTable("post_reactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull().references(() => adminPosts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reactionType: text("reaction_type", { enum: ["like", "love", "celebrate", "insightful"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const userPosts = sqliteTable("user_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  graduateId: integer("graduate_id").notNull().references(() => graduates.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  postType: text("post_type", { enum: ["update", "publication", "project", "call", "question"] }).notNull().default("update"),
  referenceUrl: text("reference_url"),
  likes: integer("likes").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const postComments = sqliteTable("post_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull().references(() => userPosts.id, { onDelete: "cascade" }),
  graduateId: integer("graduate_id").notNull().references(() => graduates.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["connection_accepted", "post_commented", "comment_replied"] }).notNull(),
  message: text("message").notNull(),
  link: text("link"),
  read: integer("read").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const events = sqliteTable("events", {
  cancelledAt:integer("cancelled_at"), revision:integer("revision").notNull().default(0),
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  location: text("location"),
  type: text("type", { enum: ["virtual", "in-person"] }).notNull(),
  link: text("link"),
  organizerId: integer("organizer_id").notNull().references(() => graduates.id, { onDelete: "cascade" }),
  maxAttendees: integer("max_attendees"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const eventAttendees = sqliteTable("event_attendees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  graduateId: integer("graduate_id").notNull().references(() => graduates.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["attending", "maybe", "declined"] }).notNull().default("attending"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const groups = sqliteTable("groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ["university", "career", "country", "interest"] }).notNull(),
  category: text("category"),
  creatorId: integer("creator_id").notNull().references(() => graduates.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const groupMembers = sqliteTable("group_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  graduateId: integer("graduate_id").notNull().references(() => graduates.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
  joinedAt: integer("joined_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const groupPosts = sqliteTable("group_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  graduateId: integer("graduate_id").notNull().references(() => graduates.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const eventNotificationLog = sqliteTable("event_notification_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["3days_before", "15min_before", "starting", "ended"] }).notNull(),
  sentAt: integer("sent_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
});

export const authRateLimits = sqliteTable("auth_rate_limits", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull(),
  expiresAt: integer("expires_at").notNull(),
});


export const emailDispatches = sqliteTable("email_dispatches", {
  id: text("id").primaryKey(), actorId: integer("actor_id").references(()=>users.id,{onDelete:"set null"}),
  recipientId: integer("recipient_id").references(()=>users.id,{onDelete:"set null"}),
  recipient: text("recipient").notNull(), subject: text("subject").notNull(), payloadHash:text("payload_hash").notNull(),
  kind:text("kind").notNull().default("manual"),
  status:text("status").notNull(), code:text("code"), correlationId:text("correlation_id").notNull(),
  createdAt:integer("created_at").notNull(),updatedAt:integer("updated_at").notNull(),
});


export const notificationPreferences=sqliteTable("notification_preferences",{
 userId:integer("user_id").primaryKey().references(()=>users.id,{onDelete:"cascade"}),
 connections:text("connections").notNull().default("off"),communities:text("communities").notNull().default("off"),events:text("events").notNull().default("off"),activity:text("activity").notNull().default("off"),updatedAt:integer("updated_at").notNull(),
});
export const notificationQueue=sqliteTable("notification_queue",{
 id:integer("id").primaryKey({autoIncrement:true}),eventKey:text("event_key").notNull().unique(),userId:integer("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),category:text("category").notNull(),kind:text("kind").notNull(),subject:text("subject").notNull(),textBody:text("text_body").notNull(),link:text("link").notNull(),dueAt:integer("due_at").notNull(),createdAt:integer("created_at").notNull(),state:text("state").notNull().default("pending"),dispatchId:text("dispatch_id").references(()=>emailDispatches.id,{onDelete:"set null"}),contextType:text("context_type"),contextId:integer("context_id"),
});
export const notificationWorkerState=sqliteTable("notification_worker_state",{key:text("key").primaryKey(),value:integer("value").notNull()});
export const passwordResetTokens=sqliteTable("password_reset_tokens",{tokenHash:text("token_hash").primaryKey(),userId:integer("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),expiresAt:integer("expires_at").notNull(),createdAt:integer("created_at").notNull()});
export const communityInvitations=sqliteTable("community_invitations",{id:integer("id").primaryKey({autoIncrement:true}),groupId:integer("group_id").notNull().references(()=>groups.id,{onDelete:"cascade"}),userId:integer("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),invitedBy:integer("invited_by").references(()=>users.id,{onDelete:"set null"}),status:text("status").notNull().default("pending"),createdAt:integer("created_at").notNull()});
export const communityAnnouncements=sqliteTable("community_announcements",{id:integer("id").primaryKey({autoIncrement:true}),groupId:integer("group_id").notNull().references(()=>groups.id,{onDelete:"cascade"}),authorId:integer("author_id").references(()=>users.id,{onDelete:"set null"}),title:text("title").notNull(),content:text("content").notNull(),createdAt:integer("created_at").notNull()});
