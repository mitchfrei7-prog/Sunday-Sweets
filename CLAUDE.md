@AGENTS.md

# Sunday Sweets 🍪

A personal app for tracking gluten-free baking: recipes, versions, bakes, taster feedback, and AI-powered insights. Built for one baker — Emma, the owner's wife — who bakes most Sundays — cookies, brownies, cakes, energy bites — with the long-term goal of converging on signature recipes she can market and sell.

## What this app is (and isn't)

- **Is:** A personal recipe lab notebook with a feedback loop. One primary user, family/friends as anonymous tasters.
- **Isn't:** A social network, a multi-tenant SaaS, or a general recipe site. No taster accounts, ever. Keep it simple.

## Key considerations — always keep in mind

1. **Kitchen-proof, mobile-first.** She uses this on a phone with flour on her hands. Big touch targets, high contrast, minimal typing. Built as a PWA installable to home screen.
2. **The killer flow is "Bake Tonight":** pick a recipe → see full history (which version, when, how it rated, what people said) → pick or tweak a version → bake → 30-second wrap-up (photo, rating, notes).
3. **Frictionless taster feedback:** each bake gets a QR code / share link → no-login form. Feedback = **four ratings, each 5 stars with half-star precision** (stored 0.5–5.0 in 0.5 steps): **Overall, Texture, Taste, Moisture** — plus an optional free-text note (what they liked/didn't) and optional name. No pre-populated tag chips. On every scale, 5 stars = perfect ("Moisture" label confirmed by Mitch — high score is always good). Only Overall is required; the rest can be skipped. Emma can also enter feedback on someone's behalf. The AI mines themes from the free text — never discard or truncate the write-ups.
4. **AI cost discipline (hard requirement: total running cost ≤ a few dollars/month):**
   - AI calls are **on-demand or scheduled, never per-page-view**. All AI output is cached/stored in the database and re-rendered from there.
   - Recipe extraction (URL → structured recipe): use **Claude Haiku** (`claude-haiku-4-5`) — cheap, fast, sufficient.
   - Insights/coaching (analysis over bake history): use a stronger model, but only triggered explicitly (button press or weekly job). Data volume is tiny (one baker, ~4–8 bakes/month), so prompts stay small.
   - **The insights model ID must be a config value (env var), not hardcoded** — starting with Sonnet 5, with a one-line swap to Opus if Mitch wants sharper analysis later.
   - Never build features that call the AI in a loop or on every render.
5. **Warm bakery aesthetic.** Cream/butter/chocolate tones, photos front and center. It should feel like her cookbook, not a corporate dashboard.
6. **Data is the moat.** Every version's "what changed and why," every bake's notes, every taster reaction — capture it structured, because the AI insights are only as good as this data.

## Core data model (four layers)

```
Recipe (concept: "GF Chocolate Chip Cookies", category, tags, source URL/photo)
  └── Version (specific formulation; diff from parent + "why" field)
        └── Bake (event: date, version used, baker notes, photos, oven quirks)
              └── Feedback (from her + tasters: stars, chips like "too sweet"/"great texture", comment, name optional)
```

- A Recipe has many Versions. Version 1 is often the original Pinterest recipe verbatim.
- A Version records a human-readable diff ("−¼ cup sugar, +1 tsp xanthan gum, 350→325°F") and a "why" ("fixing crumbly texture").
- A Bake belongs to exactly one Version. Feedback belongs to exactly one Bake.
- Never flatten these layers — the history view and the AI both depend on the separation.

## Data elements to capture

- **Recipe:** name, category (cookies/brownies/cake/bites/other), tags, source URL, source photo, date added, **GF type** (gf-native recipe that specifies exact GF flours vs. regular recipe with a 1:1 GF flour substitution — an important analysis dimension)
- **Version:** parent version, full ingredients + steps, structured diff, "why" note, created date
- **Bake:** date, version id, her rating (0.5–5.0), free notes, photos, batch size, **flour blend used** (brand or homemade mix — often the biggest variable in GF baking), **weather/humidity** (auto-fetched from a free weather API for the bake date; never ask Emma to enter it), optional **bake-off flag** (see below)
- **Feedback:** bake id, ratings for overall / texture / taste / moisture (each 0.5–5.0 in half-star steps; overall required, others optional), free-text write-up (what they liked / didn't like), taster name (optional), entered-by (taster via link vs. Emma on behalf)
- **AI outputs (cached):** insight text, type (per-recipe coach / digest / what-to-bake), generated date, input snapshot hash

### Bake-offs (optional, lightweight)

A bake can optionally be flagged as a **bake-off**: one recipe, dough/batter split into variant A and variant B with one change (e.g., half the batch gets extra xanthan gum). Emma usually has time for only one recipe per night, so this must stay a simple toggle on the bake form — never a separate flow or a second recipe. When toggled on: the bake records what differs between A and B, and the taster feedback form asks for a rating + note per variant instead of one. Blind labeling (tasters don't know which plate is which) is the point.

## Navigation & app structure

Mobile-first PWA with a **bottom tab bar** (thumb-reachable, kitchen-proof). Four tabs + one center action:

```
┌─────────────────────────────────────────────┐
│                 (screen content)            │
├─────────────────────────────────────────────┤
│  Home   Recipes   [+ Bake]   Insights  More │
└─────────────────────────────────────────────┘
```

- **Home** — tonight-focused dashboard: "Bake Tonight" CTA, recent bakes with latest ratings, any new taster feedback since last visit.
- **Recipes** — the recipe box: searchable/filterable list by category → Recipe detail (photo, version timeline with avg ratings, bake history) → Version detail (full ingredients/steps, diff, "why") → "Bake this" button.
- **+ Bake** (center, visually prominent) — the killer flow as a modal/full-screen flow: pick recipe → recap of history → pick or tweak version (tweak = creates new version with diff + why) → log the bake → wrap-up screen (photo, her ratings, notes, flour blend) → share/QR screen for tasters.
- **Insights** — AI coach cards, weekly digest, "what should I bake Sunday?" button. In Phase 1–2 this tab shows simple non-AI stats (top rated, most baked) so it's never empty; AI content lands in Phase 3.
- **More** — settings: flour blend list, household tasters, Hall of Fame (Phase 4), pricing calculator (Phase 4), data export.

**Standalone routes (no tab bar):** the taster feedback form (`/f/[bakeShareId]`) — what the QR opens; must load fast, work on any phone browser, and never require login. Later, the public menu page (Phase 4).

Depth rule: nothing important more than 2 taps from a tab. Emma's most common journey (open app → Bake Tonight → pick recipe → start) must be ≤ 3 taps.

## Build phases

- **Phase 1 — Recipe Box + Bake Journal:** recipes, versions, bake logging, her own ratings/notes/photos. URL-paste extraction via Claude Haiku. Single user auth. *Goal: she genuinely uses it every Sunday.*
- **Phase 2 — Taster Feedback:** per-bake QR/share links, no-login feedback form, feedback rollups.
- **Phase 3 — AI Insights:** per-recipe coach, periodic digest, "what should I bake Sunday?" — built only after ~1–2 months of real data exists.
- **Phase 4 — Hall of Fame & Selling Tools:** signature recipe promotion, printable recipe cards, **pricing calculator** (ingredient cost per batch + time at a chosen hourly rate → suggested price per dozen at a target margin — Mitch is business/profit centric, this is a priority feature of the phase), optional public menu page (deferred until she's ready to sell).

## Stack

- **Frontend/hosting:** Next.js (App Router) on Vercel (Hobby tier, $0)
- **Database:** Postgres via Neon or Supabase free tier ($0)
- **AI:** Claude API — Haiku 4.5 for extraction, stronger model for insights; expected AI spend well under $1/month at real usage
- **Auth:** simple single-user auth (she + Mitch); tasters never authenticate
- **Repo:** GitHub; deploy via Vercel Git integration

## Decisions log

- 2026-07-16: No taster logins — QR/no-auth form only. Confirmed by Mitch.
- 2026-07-16: Feedback shape = 5 stars with half-star precision (10-point scale) + free-text write-up. No pre-populated tag chips — Mitch prefers tasters describe likes/dislikes in their own words. Confirmed.
- 2026-07-16: Pinterest integration = paste-a-link extraction only (Pinterest API not viable). Confirmed.
- 2026-07-16: Voice input is a later nice-to-have, not planned.
- 2026-07-16: Public-facing page deferred to Phase 4.
- 2026-07-16: Budget cap: total running cost should stay within a few dollars/month. Mitch will pay for stronger models where the value is real (insights), not where it isn't (extraction).
- 2026-07-17: Insights model starts on Sonnet 5, configurable via env var for easy upgrade to Opus. Extraction stays on Haiku.
- 2026-07-17: Flour tracking confirmed: flour blend per bake + GF type per recipe (gf-native vs. 1:1 substituted). Humidity auto-fetched per bake.
- 2026-07-17: Bake-offs confirmed but only as a lightweight toggle on a single bake (split one batch into A/B) — never a separate flow. Emma has time for one recipe per night.
- 2026-07-17: Pricing calculator confirmed as a Phase 4 priority.
- 2026-07-17: Insights model = Sonnet 5 confirmed ("stick with Sonnet for now"); env-var swap to Opus stays available.
- 2026-07-17: Feedback form v2 (supersedes single rating + write-up): four half-star ratings — Overall (required), Texture, Taste, Moisture (optional) — plus optional notes + name. "Moisture" label pending Mitch's confirmation (his word was "dryness"; flipped so 5 = perfect on every scale).
- 2026-07-17: Navigation = bottom tab bar (Home / Recipes / + Bake / Insights / More); taster form is a standalone no-login route. Tab design + "Moisture" label confirmed by Mitch.
- 2026-07-17: Phase 1 build started. Stack details: Next.js App Router + TypeScript + Tailwind, Drizzle ORM + Postgres (works with Neon or Supabase), @anthropic-ai/sdk for extraction.
- Not yet decided (proposed, awaiting Mitch): experiment queue, failure log, taster profiles, photo gallery, Year in Bakes, bake-day mode.
