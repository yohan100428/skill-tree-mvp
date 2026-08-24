# Skill Tree MVP Phase 2 Design

## Goal

Replace the independent-tree level editor with one persistent skill map where completing a category's daily quests awards cumulative category coins, and those coins plus unlocked prerequisites make skills available for explicit, non-consuming unlocks.

## Architecture

Keep the existing Vite, React, TypeScript, React Flow, Vitest, and localStorage foundation. Replace the version 1 multi-tree document with a version 2 single-map workspace owned by the existing state hook. React Flow remains the graph view and input layer; pure utilities own quest completion, graph mutations, validation, and status derivation.

## Data Model

- `WorkspaceData` has `version: 2`, `categories`, `quests`, `nodes`, `edges`, and `selectedCategoryId`.
- `TreeCategory` has an id, editable name, editable coin name, and a non-negative integer coin balance.
- `DailyQuest` belongs to one category and has an editable title, non-negative integer reward, and a local-date completion string or `null`.
- `SkillData` has id, name, description, category id, non-negative integer required coins, prerequisite ids, and `locked | available | unlocked` status.
- React Flow positions remain on skill nodes and persist with edges.
- Every skill and quest references an existing category. Invalid references make stored data invalid and trigger demo recovery.

## Status and Unlock Rules

- An already `unlocked` skill remains unlocked; unlocks are not revoked when requirements are edited later.
- Every other skill is `available` only when its category balance meets `requiredCoins` and every prerequisite skill is `unlocked`.
- Otherwise the skill is `locked`.
- Unlocking is accepted only for an available skill and changes it to `unlocked` without reducing coins.
- Edge direction is prerequisite source to dependent target. Cross-category edges are allowed; the target still checks the coin balance of its own category.
- Existing self, duplicate, missing-node, and directed-cycle protections remain.

## Daily Quests and Local Dates

- Completing a quest compares `completedDate` with a caller-supplied local `YYYY-MM-DD` value.
- If the dates match, completion is a no-op and grants no coins.
- Otherwise the quest receives today's date and its reward is added to its category balance once.
- A new local day requires no cron or stored reset. The quest becomes actionable because its saved date no longer equals today.
- Rewards and balances are clamped to non-negative integers.

## Mutations

- Users can create, rename, and delete categories and edit their coin names.
- A blank coin name is normalized to `<Category Name> Coin` when a category is created or the field is left blank.
- Users can create, edit, complete, and delete quests within the selected category.
- Users can add, edit, move, connect, unlock, and delete skills on the single map.
- New skills require a category; adding a skill is disabled if no category exists.
- Deleting a category cascades to its quests and skills, then removes connected edges and prerequisite references. Selection moves to the first remaining category or becomes empty.

## Persistence and Recovery

- Save the complete version 2 workspace under a new localStorage key after state changes.
- Restore only structurally valid version 2 data, normalize numeric values and graph references, and recompute non-unlocked statuses.
- Missing, malformed, version 1, unsupported, or invalid data falls back to a fresh Phase 2 demo instead of crashing.
- The demo contains Fitness and Study categories, their requested quests, linear skill branches, positions, and edges.

## UI

- Keep the current dark, functional desktop shell.
- The left sidebar becomes category management and shows every category's coin name and balance.
- Selecting a category exposes its editable details and daily quests in the sidebar/panel area.
- The center always renders every category's skills together on one React Flow map.
- The top bar is fixed to `MY SKILL TREE`, shows unlocked progress, and adds skills.
- The right editor exposes skill name, description, category, required coins, prerequisite names, derived status, coin progress, Unlock, and Delete Skill.
- Nodes show name, coin requirement, and locked/available/unlocked state.

## Error Handling

- Invalid connections remain unchanged and report the existing short notice.
- Invalid numeric input is normalized to zero or a safe integer.
- Deleting a category uses a native confirmation because it cascades. Skill and quest deletion use their explicit controls.
- Storage failures do not prevent in-memory use.

## Testing

- Pure quest tests cover reward addition, same-day duplicate prevention, and next-day availability.
- Pure skill tests cover insufficient coins, missing prerequisites, available status, unlock persistence, non-consuming unlock, graph connection rules, and deletion cleanup.
- Storage tests cover a complete round trip and fallback from malformed, invalid, and version 1 data.
- Testing Library covers category/quest management and the visible quest → coin → available → unlock progression.
- Final verification runs `npm test -- --run` and `npm run build` with zero failures.

## Out of Scope

No login, server, database, social features, ranking, payments, AI, achievements, story, characters, items, shop, coin spending, streaks, calendar, notifications, analytics graphs, mobile app, elaborate animation, or unrelated design refactor.
