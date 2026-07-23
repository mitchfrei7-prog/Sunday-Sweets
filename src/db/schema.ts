import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ────────────────────────────────────────────────────────────────────

export const recipeCategory = pgEnum("recipe_category", [
  "cookies",
  "brownies",
  "cakes",
  "pies",
  "snacks",
  "muffins",
  "other",
]);

// gf_native = recipe written for GF flours; substituted = regular recipe with a
// 1:1 GF flour swap. An important analysis dimension for the AI.
export const gfType = pgEnum("gf_type", ["gf_native", "substituted"]);

export const enteredBy = pgEnum("entered_by", ["taster", "emma"]);

// Bake-off support: feedback rows are per-variant when a bake is split A/B.
export const bakeVariant = pgEnum("bake_variant", ["single", "a", "b"]);

export const insightType = pgEnum("insight_type", [
  "recipe_coach",
  "digest",
  "what_to_bake",
]);

// ── Layer 1: Recipe (the concept) ────────────────────────────────────────────

export const recipes = pgTable("recipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: recipeCategory("category").notNull().default("other"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  sourceUrl: text("source_url"),
  sourcePhotoUrl: text("source_photo_url"),
  gfType: gfType("gf_type"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Layer 2: Version (a specific formulation) ────────────────────────────────

export const versions = pgTable("versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  parentVersionId: uuid("parent_version_id"),
  versionNumber: integer("version_number").notNull().default(1),
  // Optional custom name, e.g. "½ flour ½ oats"; falls back to "Version N"
  label: text("label"),
  ingredients: jsonb("ingredients").$type<string[]>().notNull().default([]),
  steps: jsonb("steps").$type<string[]>().notNull().default([]),
  // Human-readable diff from the parent version, e.g. "−¼ cup sugar, +1 tsp xanthan gum"
  diffSummary: text("diff_summary"),
  // The "why" behind the change, e.g. "fixing crumbly texture" — gold for the AI
  why: text("why"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Layer 3: Bake (an event) ─────────────────────────────────────────────────

export const flourBlends = pgTable("flour_blends", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  isHomemade: boolean("is_homemade").notNull().default(false),
  notes: text("notes"),
});

export const bakes = pgTable("bakes", {
  id: uuid("id").primaryKey().defaultRandom(),
  versionId: uuid("version_id")
    .notNull()
    .references(() => versions.id, { onDelete: "cascade" }),
  bakedOn: date("baked_on").notNull(),
  // Emma's own wrap-up ratings, 0.5–5.0 in half-star steps. Overall (rating)
  // plus the same three dimensions tasters rate; all optional. Kept on the bake
  // row (her self-assessment) so they never skew taster averages.
  rating: numeric("rating", { precision: 2, scale: 1 }),
  texture: numeric("texture", { precision: 2, scale: 1 }),
  taste: numeric("taste", { precision: 2, scale: 1 }),
  moisture: numeric("moisture", { precision: 2, scale: 1 }),
  // "What I changed / did tonight" (notes) + "how it turned out" (outcomeNotes)
  notes: text("notes"),
  outcomeNotes: text("outcome_notes"),
  // Deprecated 2026-07-23 (batch size + bake-offs removed from the UI); columns
  // kept to avoid a destructive migration.
  batchSize: text("batch_size"),
  flourBlendId: uuid("flour_blend_id").references(() => flourBlends.id),
  // Auto-fetched for the bake date — never entered by Emma
  weather: jsonb("weather").$type<{ humidity?: number; tempF?: number }>(),
  isBakeoff: boolean("is_bakeoff").notNull().default(false),
  bakeoffDiff: text("bakeoff_diff"),
  // Short unguessable id used in the QR/share link for taster feedback
  shareId: text("share_id").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bakePhotos = pgTable("bake_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  bakeId: uuid("bake_id")
    .notNull()
    .references(() => bakes.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Layer 4: Feedback ────────────────────────────────────────────────────────

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  bakeId: uuid("bake_id")
    .notNull()
    .references(() => bakes.id, { onDelete: "cascade" }),
  variant: bakeVariant("variant").notNull().default("single"),
  // Four half-star ratings, 0.5–5.0. Overall required; texture/taste/moisture optional.
  overall: numeric("overall", { precision: 2, scale: 1 }).notNull(),
  texture: numeric("texture", { precision: 2, scale: 1 }),
  taste: numeric("taste", { precision: 2, scale: 1 }),
  moisture: numeric("moisture", { precision: 2, scale: 1 }),
  // Free-text write-up — raw material for AI insights; never truncate
  notes: text("notes"),
  tasterName: text("taster_name"),
  enteredBy: enteredBy("entered_by").notNull().default("taster"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Cached AI outputs (never regenerated per page view) ──────────────────────

export const aiInsights = pgTable("ai_insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: insightType("type").notNull(),
  // Set when the insight is scoped to one recipe (recipe_coach)
  recipeId: uuid("recipe_id").references(() => recipes.id, {
    onDelete: "cascade",
  }),
  content: text("content").notNull(),
  // Hash of the input snapshot so we can skip regeneration when nothing changed
  inputHash: text("input_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Relations ────────────────────────────────────────────────────────────────

export const recipesRelations = relations(recipes, ({ many }) => ({
  versions: many(versions),
}));

export const versionsRelations = relations(versions, ({ one, many }) => ({
  recipe: one(recipes, {
    fields: [versions.recipeId],
    references: [recipes.id],
  }),
  bakes: many(bakes),
}));

export const bakesRelations = relations(bakes, ({ one, many }) => ({
  version: one(versions, {
    fields: [bakes.versionId],
    references: [versions.id],
  }),
  flourBlend: one(flourBlends, {
    fields: [bakes.flourBlendId],
    references: [flourBlends.id],
  }),
  photos: many(bakePhotos),
  feedback: many(feedback),
}));

export const bakePhotosRelations = relations(bakePhotos, ({ one }) => ({
  bake: one(bakes, { fields: [bakePhotos.bakeId], references: [bakes.id] }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  bake: one(bakes, { fields: [feedback.bakeId], references: [bakes.id] }),
}));
