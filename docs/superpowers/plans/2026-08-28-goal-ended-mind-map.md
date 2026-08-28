# Goal-Ended Personal Mind Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a user-centered mind map whose category branches always end in a required final goal, while removing coin mechanics and retaining quests as daily check-offs.

**Architecture:** Persist a lean version-3 workspace and migrate valid version-2 data into it. Keep the user, category, and final-goal nodes derived in `personalTree`, with terminal skill detection generating edges into each final goal. Remove economic and unlock state from domain records so the UI consumes the simpler model directly.

**Tech Stack:** React 19, TypeScript 5.8, React Flow 12, Vitest 3, Testing Library, Vite 7

**Spec:** `docs/superpowers/specs/2026-08-28-goal-ended-mind-map-design.md`

## Global Constraints

- Every category stores a non-empty `finalGoal` string.
- Final goals are derived, fixed leaf nodes and are never persisted as skills.
- Skills may branch; every terminal skill connects to its category final goal.
- Quests retain daily completion but have no rewards.
- Valid version-2 data is migrated without losing user-authored categories, quests, skills, edges, positions, descriptions, prerequisites, or completion dates.
- All coin and unlock data, logic, controls, labels, and feedback are removed.

---

### Task 1: Version-3 Domain Model and Storage Migration

**Files:**
- Modify: `src/types/skillTree.ts`
- Modify: `src/data/defaultTree.ts`
- Modify: `src/utils/storage.ts`
- Test: `src/utils/storage.test.ts`

**Interfaces:**
- Produces: `TreeCategory { id, name, finalGoal }`, reward-free `DailyQuest`, status-free `SkillData`, and `WorkspaceData.version: 3`.
- Produces: `STORAGE_KEY = 'skill-tree-workspace-v3'`; `loadWorkspace(storage)` checks v3 first and migrates legacy v2 from `skill-tree-workspace-v2`.
- Consumes: browser-compatible `Storage` and existing React Flow node/edge shapes.

- [ ] **Step 1: Write failing storage tests**

Add literal fixtures asserting that a version-3 round trip preserves the lean fields and that a version-2 fixture migrates to:

```ts
expect(migrated.version).toBe(3)
expect(migrated.categories[0]).toEqual({ id: 'fitness', name: '운동', finalGoal: '최종목표' })
expect(migrated.quests[0]).toEqual({
  id: 'daily', categoryId: 'fitness', title: '달리기', completedDate: null,
})
expect(migrated.nodes[0].data).toEqual({
  id: 'run', name: '달리기', description: '', categoryId: 'fitness', prerequisiteIds: [],
})
```

- [ ] **Step 2: Run storage tests and verify RED**

Run: `npm test -- --run src/utils/storage.test.ts`

Expected: FAIL because version 3 and `finalGoal` are not supported and coin fields remain required.

- [ ] **Step 3: Implement the minimal model and migration**

Define the lean records, update the empty/default workspace, validate v3 data, and add a private legacy validator/converter. Save only v3 fields and prefer the v3 key when both keys exist.

```ts
export interface TreeCategory { id: string; name: string; finalGoal: string }
export interface DailyQuest {
  id: string; categoryId: string; title: string; completedDate: string | null
}
export type SkillData = Record<string, unknown> & {
  id: string; name: string; description: string; categoryId: string; prerequisiteIds: string[]
}
```

- [ ] **Step 4: Run storage tests and verify GREEN**

Run: `npm test -- --run src/utils/storage.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the domain migration**

```bash
git add src/types/skillTree.ts src/data/defaultTree.ts src/utils/storage.ts src/utils/storage.test.ts
git commit -m "feat: migrate workspace away from coins"
```

### Task 2: Goal-Ended Personal Graph

**Files:**
- Modify: `src/utils/personalTree.ts`
- Modify: `src/utils/personalTree.test.ts`
- Create: `src/components/FinalGoalNode.tsx`
- Modify: `src/components/SkillTreeCanvas.tsx`
- Modify: `src/components/CategoryNode.tsx`
- Modify: `src/components/SkillNode.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `finalGoalNodeId(categoryId): string` and a derived `FinalGoalNode` with type `finalGoal`.
- Produces: graph edges `category → goal` for an empty category or `terminal skill → goal` for populated branches.
- Consumes: persisted skill dependencies and deterministic category radial direction.

- [ ] **Step 1: Write failing graph tests**

Add tests with hand-built workspaces asserting exact source/target pairs:

```ts
expect(edgePairs(buildPersonalTree(emptyCategoryWorkspace))).toContainEqual([
  categoryNodeId('fitness'), finalGoalNodeId('fitness'),
])
expect(edgePairs(buildPersonalTree(chainWorkspace))).toEqual(expect.arrayContaining([
  [categoryNodeId('fitness'), 'warmup'],
  ['warmup', 'run'],
  ['run', finalGoalNodeId('fitness')],
]))
expect(edgePairs(buildPersonalTree(splitWorkspace))).toEqual(expect.arrayContaining([
  ['run', finalGoalNodeId('fitness')],
  ['strength', finalGoalNodeId('fitness')],
]))
```

- [ ] **Step 2: Run graph tests and verify RED**

Run: `npm test -- --run src/utils/personalTree.test.ts`

Expected: FAIL because no final-goal node or terminal-to-goal edges exist.

- [ ] **Step 3: Implement terminal detection and goal layout**

Create one fixed goal node per category. Treat a skill as terminal when no same-category edge has that skill as `source`. Place the goal beyond the maximum radial projection of that category's skills, with a minimum radius beyond the category.

```ts
const terminalIds = categorySkills
  .filter((skill) => !workspace.edges.some((edge) => edge.source === skill.id))
  .map((skill) => skill.id)
const goalSources = terminalIds.length ? terminalIds : [categoryNodeId(category.id)]
```

- [ ] **Step 4: Render visually distinct goal and neutral skill nodes**

Register `finalGoal` in `nodeTypes`, render the goal label with `FINAL GOAL`, remove status and coin copy from category/skill nodes, and add goal-node styles without changing existing pan/zoom behavior.

- [ ] **Step 5: Run graph tests and build, then commit**

Run: `npm test -- --run src/utils/personalTree.test.ts && npm run build`

Expected: both commands exit 0.

```bash
git add src/utils/personalTree.ts src/utils/personalTree.test.ts src/components/FinalGoalNode.tsx src/components/SkillTreeCanvas.tsx src/components/CategoryNode.tsx src/components/SkillNode.tsx src/styles.css
git commit -m "feat: end category branches with final goals"
```

### Task 3: Reward-Free Quest and Skill Actions

**Files:**
- Modify: `src/utils/questLogic.ts`
- Modify: `src/utils/questLogic.test.ts`
- Modify: `src/utils/skillLogic.ts`
- Modify: `src/utils/skillLogic.test.ts`
- Modify: `src/hooks/useSkillMap.ts`
- Modify: `src/hooks/useSkillMap.test.tsx`

**Interfaces:**
- Produces: `completeDailyQuest(workspace, questId, today?)` that updates only `completedDate`.
- Produces: `addCategory(name, finalGoal)`, required goal validation, reward-free quest inputs, and requirement-free skill inputs.
- Removes: `unlockSkill`, `recalculateMap`, and all coin normalization/state transitions.

- [ ] **Step 1: Write failing behavior tests**

Assert that quest completion changes only the matching quest date, category creation persists a trimmed goal, empty goals are rejected, and skill CRUD/dependencies operate without status or requirements:

```ts
const before = structuredClone(workspace)
const completed = completeDailyQuest(workspace, 'daily', '2026-08-28')
expect(completed.quests[0].completedDate).toBe('2026-08-28')
expect(completed.categories).toEqual(before.categories)
expect(completed.nodes).toEqual(before.nodes)
```

- [ ] **Step 2: Run logic and hook tests and verify RED**

Run: `npm test -- --run src/utils/questLogic.test.ts src/utils/skillLogic.test.ts src/hooks/useSkillMap.test.tsx`

Expected: FAIL because current APIs require coin fields and unlock state.

- [ ] **Step 3: Simplify quest, dependency, and hook logic**

Keep cycle/category validation and prerequisite synchronization, but remove coin normalization, recalculation, and unlock transitions. Make category creation return `undefined` for blank name or final goal and otherwise atomically append `{ id, name, finalGoal }`.

- [ ] **Step 4: Run behavior tests and verify GREEN**

Run: `npm test -- --run src/utils/questLogic.test.ts src/utils/skillLogic.test.ts src/hooks/useSkillMap.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit simplified actions**

```bash
git add src/utils/questLogic.ts src/utils/questLogic.test.ts src/utils/skillLogic.ts src/utils/skillLogic.test.ts src/hooks/useSkillMap.ts src/hooks/useSkillMap.test.tsx
git commit -m "feat: keep quests as simple daily checks"
```

### Task 4: Required Goal Forms and Coin-Free Application UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/components/forms/TreeForm.tsx`
- Modify: `src/components/forms/SkillForm.tsx`
- Modify: `src/components/forms/QuestForm.tsx`
- Modify: `src/components/mobile/TodayPage.tsx`
- Modify: `src/components/mobile/QuestGroup.tsx`
- Modify: `src/components/mobile/SkillBottomSheet.tsx`
- Modify: `src/components/mobile/TreePage.tsx`
- Modify: `src/components/mobile/SettingsSheet.tsx`
- Modify or remove unused legacy desktop components that fail against the new model.
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: required `(name, finalGoal)` category submission and lean quest/skill inputs.
- Produces: accessible form labels `카테고리 이름` and `최종목표`, with submit disabled until both are non-empty.
- Removes: reward controls, unlock controls, balances, progress, feedback, and every user-facing Coin label.

- [ ] **Step 1: Write failing application tests**

Add an integration test that opens category creation, confirms submission is disabled until both inputs are filled, submits, and observes the user, category, and goal nodes on the same canvas. Update quest completion assertions to check the completed state without reward feedback.

```ts
fireEvent.change(screen.getByRole('textbox', { name: '카테고리 이름' }), {
  target: { value: '운동' },
})
expect(screen.getByRole('button', { name: '만들기' })).toBeDisabled()
fireEvent.change(screen.getByRole('textbox', { name: '최종목표' }), {
  target: { value: '마라톤 완주' },
})
fireEvent.click(screen.getByRole('button', { name: '만들기' }))
expect(screen.getByTestId(/^final-goal-node-/)).toHaveTextContent('마라톤 완주')
```

- [ ] **Step 2: Run application tests and verify RED**

Run: `npm test -- --run src/App.test.tsx`

Expected: FAIL because the goal field/node is absent and coin UI remains.

- [ ] **Step 3: Implement the required-goal and coin-free UI**

Wire forms and App to the new action signatures, remove unlock and feedback state, render quests as check-offs, render skill details as name/description/prerequisites only, expose `finalGoal` editing in settings, and remove obsolete coin-only UI branches and styles.

- [ ] **Step 4: Run all tests and build**

Run: `npm test -- --run && npm run build`

Expected: all tests pass and production build exits 0 with no TypeScript errors.

- [ ] **Step 5: Scan for coin remnants and commit**

Run: `grep -RIn --exclude-dir=node_modules --exclude-dir=dist -E 'coin|Coin|requiredCoins|rewardCoins|unlock|Unlock' src`

Expected: no output.

```bash
git add src
git commit -m "feat: require final goals in the personal mind map"
```

### Task 5: Final Verification and Push

**Files:**
- Verify: all tracked project files

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: a tested commit series pushed to the current branch's configured upstream.

- [ ] **Step 1: Verify requirements and repository state**

Run: `npm test -- --run && npm run build && git diff --check && git status --short --branch`

Expected: tests and build exit 0, no whitespace errors, and only the implementation-plan file remains uncommitted if it was not committed earlier.

- [ ] **Step 2: Commit the implementation plan if needed**

```bash
git add docs/superpowers/plans/2026-08-28-goal-ended-mind-map.md
git commit -m "docs: plan goal-ended mind map implementation"
```

- [ ] **Step 3: Push the current branch**

Run: `git push`

Expected: the configured upstream branch advances to the final local commit.
