# Skill Tree MVP Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one persistent skill map where category daily quests award cumulative coins and skills unlock explicitly after coin and prerequisite requirements are met.

**Architecture:** Replace the version 1 multi-tree document with a version 2 single-map workspace while retaining React Flow and its graph editing behavior. Keep mutations in the existing hook, derive status and quest rewards in pure utilities, and render focused category, quest, canvas, and editor components.

**Tech Stack:** React 19, TypeScript 5.8, Vite 7, @xyflow/react 12, Vitest 3, Testing Library, CSS, localStorage

**Spec:** `docs/superpowers/specs/2026-08-24-skill-tree-phase-2-design.md`

## Global Constraints

- Coin balances and rewards are cumulative non-negative integers and unlocking never spends coins.
- Daily completion uses a local `YYYY-MM-DD` string and grants each quest at most once per date.
- Every skill and quest belongs to an existing category.
- One React Flow map contains all category skills and preserves positions and edges.
- Reject self, duplicate, missing-node, and cyclic connections.
- Version 1 or malformed storage falls back to version 2 demo data without migration.
- Do not add any out-of-scope systems or redesign beyond the functional dark UI.

---

### Task 1: Version 2 Domain and Quest Engine

**Files:**
- Modify: `src/types/skillTree.ts`
- Modify: `src/utils/skillLogic.ts`
- Modify: `src/utils/skillLogic.test.ts`
- Create: `src/utils/questLogic.ts`
- Create: `src/utils/questLogic.test.ts`

**Interfaces:**
- Produces `TreeCategory`, `DailyQuest`, version 2 `SkillData`, `SkillMap`, and `WorkspaceData`.
- Produces `recalculateMap(map, categories)`, `unlockSkill(map, categories, skillId)`, the existing dependency mutation API adapted to `SkillMap`, `getLocalDate(date?)`, `canCompleteQuest(quest, today)`, and `completeDailyQuest(workspace, questId, today)`.

- [ ] **Step 1: Write failing status and unlock tests**

  Replace level assertions with literal fixtures proving 70/100 coins locks, 100 coins with a locked prerequisite locks, 100 coins with unlocked prerequisites becomes available, and unlocking changes only status while preserving the balance.

- [ ] **Step 2: Run the domain tests and verify RED**

  Run: `npm test -- --run src/utils/skillLogic.test.ts`

  Expected: TypeScript/module failures because the version 2 interfaces and unlock function do not exist.

- [ ] **Step 3: Implement the minimal version 2 types and skill engine**

  Define the status union as `locked | available | unlocked`; replace level fields with `categoryId` and `requiredCoins`; replace `SkillTree` with `{ nodes, edges }`; preserve graph cleanup/cycle logic; recompute only non-unlocked nodes from category balances and unlocked prerequisites.

- [ ] **Step 4: Run the domain tests and verify GREEN**

  Run: `npm test -- --run src/utils/skillLogic.test.ts`

  Expected: all focused tests pass.

- [ ] **Step 5: Write failing quest tests**

  Add real workspace fixtures asserting a reward changes Fitness coins from 10 to 12, a matching completion date is a no-op, and yesterday's completion can award again today.

- [ ] **Step 6: Run quest tests and verify RED**

  Run: `npm test -- --run src/utils/questLogic.test.ts`

  Expected: module-not-found failure for `questLogic`.

- [ ] **Step 7: Implement the minimal quest engine and verify GREEN**

  Complete by immutable id lookup, set `completedDate` to the supplied date, increment only the owning category, call status recalculation, and return unchanged state for missing/already-completed quests.

  Run: `npm test -- --run src/utils/questLogic.test.ts src/utils/skillLogic.test.ts`

  Expected: all focused tests pass.

### Task 2: Demo and Versioned Persistence

**Files:**
- Modify: `src/data/defaultTree.ts`
- Modify: `src/utils/storage.ts`
- Modify: `src/utils/storage.test.ts`

**Interfaces:**
- Consumes the Task 1 version 2 types and `recalculateMap`.
- Produces `createDefaultWorkspace()`, `STORAGE_KEY = skill-tree-workspace-v2`, `loadWorkspace(storage)`, and `saveWorkspace(storage, workspace)`.

- [ ] **Step 1: Write failing storage tests**

  Assert literal round-trip values for categories, balances, quests, completion dates, skill category/requirements/status, positions, and edges. Assert malformed JSON, invalid category references, and data under the version 1 key recover to a fresh demo.

- [ ] **Step 2: Run storage tests and verify RED**

  Run: `npm test -- --run src/utils/storage.test.ts`

  Expected: failures because version 1 parsing lacks Phase 2 fields.

- [ ] **Step 3: Build the requested demo and version 2 validator**

  Create Fitness and Study categories, two quests each, four Fitness skills and three Study skills with linear edges and distinct positions. Validate every nested field, require referenced categories, normalize graph data, and fall back atomically on any unsupported document.

- [ ] **Step 4: Run storage and domain tests and verify GREEN**

  Run: `npm test -- --run src/utils/storage.test.ts src/utils/skillLogic.test.ts src/utils/questLogic.test.ts`

  Expected: all focused tests pass.

### Task 3: Single-Map State Actions

**Files:**
- Move and modify: `src/hooks/useSkillTrees.ts` → `src/hooks/useSkillMap.ts`
- Create: `src/hooks/useSkillMap.test.tsx`

**Interfaces:**
- Consumes all Task 1 and Task 2 utilities.
- Produces one `useSkillMap` action surface for category CRUD, quest CRUD/completion, skill CRUD/unlock, connection changes, node movement, edge removal, and persistence.

- [ ] **Step 1: Write failing hook behavior tests**

  Render a minimal harness against real localStorage and assert category creation defaults the coin name, category deletion cascades, quest edits persist, adding a skill uses the selected category, and completing a quest recalculates skill status.

- [ ] **Step 2: Run hook tests and verify RED**

  Run: `npm test -- --run src/hooks/useSkillMap.test.tsx`

  Expected: import/action failures because the single-map hook is absent.

- [ ] **Step 3: Implement the minimal hook actions**

  Rename the hook and its action interface, centralize immutable workspace updates, normalize numeric patches, keep selection valid, cascade category deletion through `deleteSkill`, and save after every state change.

- [ ] **Step 4: Run hook and utility tests and verify GREEN**

  Run: `npm test -- --run src/hooks/useSkillMap.test.tsx src/utils/*.test.ts`

  Expected: all focused tests pass.

### Task 4: Category, Quest, Node, and Editor UI

**Files:**
- Create: `src/components/CategorySidebar.tsx`
- Create: `src/components/QuestPanel.tsx`
- Modify: `src/components/SkillNode.tsx`
- Modify: `src/components/SkillTreeCanvas.tsx`
- Modify: `src/components/SkillEditor.tsx`
- Modify: `src/components/TopBar.tsx`
- Delete: `src/components/TreeSidebar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes the Task 3 hook and passes focused callbacks to each UI region.
- Produces the visible category CRUD, quest CRUD/completion, all-category map, skill editor, and explicit unlock flow.

- [ ] **Step 1: Replace app tests with failing Phase 2 flows**

  Test that the demo renders one `MY SKILL TREE`, category balances and all categories' nodes; completing a quest increments only its category once; the resulting available skill can be unlocked without spending coins; category creation accepts a custom coin name; and skill creation/editor category selection works.

- [ ] **Step 2: Run app tests and verify RED**

  Run: `npm test -- --run src/App.test.tsx`

  Expected: failures for missing Phase 2 controls and labels.

- [ ] **Step 3: Implement the focused components**

  Render category rows with coin balances and add/delete controls; render the selected category form and quest list with checked state based on today's date; render all nodes on one stable React Flow instance; show coin requirements on nodes; replace level controls with category, required coins, progress, prerequisite list, and conditionally enabled Unlock.

- [ ] **Step 4: Run app tests and verify GREEN**

  Run: `npm test -- --run src/App.test.tsx`

  Expected: all app tests pass.

### Task 5: Styling, Full Verification, and Delivery

**Files:**
- Modify: `src/styles.css`
- Modify only files implicated by full verification failures.

**Interfaces:**
- Produces a readable dark desktop layout and a verified production bundle.

- [ ] **Step 1: Adapt existing CSS without a visual redesign**

  Reuse shell, canvas, button, editor, node, and status styles; add compact category and quest controls; remove level/in-progress/completed selectors; ensure sidebar and editor independently scroll.

- [ ] **Step 2: Run the complete test suite**

  Run: `npm test -- --run`

  Expected: all test files pass with zero failures.

- [ ] **Step 3: Run the production build**

  Run: `npm run build`

  Expected: TypeScript build and Vite bundle exit successfully.

- [ ] **Step 4: Audit requirements and repository state**

  Compare the implementation with every design section, run `git diff --check`, inspect `git status --short --branch`, and confirm no level, maxLevel, Complete Skill, independent tree UI, or version 1 runtime fields remain.

- [ ] **Step 5: Commit and push safely**

  Stage the Phase 2 implementation and plan, commit with `Implement quest coin skill unlock loop`, verify `origin/main` and that local `main` can fast-forward push, then run `git push origin main` without force.
