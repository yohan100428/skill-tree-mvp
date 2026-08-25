# ME-Centered Personal Skill Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render one personal mind-map canvas where ME connects to every category and each category connects to its root skills and descendant skill chains.

**Architecture:** Keep `WorkspaceData` version 2 unchanged and derive non-persisted ME/category view nodes plus structural edges at render time. A pure graph builder owns topology and initial category placement; the canvas filters derived-node mutations before forwarding persisted skill changes.

**Tech Stack:** React 19, TypeScript, `@xyflow/react`, Vitest, Testing Library, CSS

**Spec:** `docs/superpowers/specs/2026-08-25-me-centered-skill-map-design.md`

## Global Constraints

- Fresh and reset workspaces persist no categories, quests, skills, or edges.
- ME is always derived and visible in Tree.
- Categories and skills from every branch appear on one canvas without tabs.
- Persisted workspace schema remains version 2; no migration is introduced.
- Existing skill CRUD, dependency, unlock, quest, reset, and R-shortcut behavior remains intact.

---

### Task 1: Build the derived personal-map graph

**Files:**
- Create: `src/utils/personalTree.ts`
- Create: `src/utils/personalTree.test.ts`
- Modify: `src/types/skillTree.ts`

**Interfaces:**
- Produces: `ME_NODE_ID`, `categoryNodeId(categoryId)`, `PersonalTreeNode`, `PersonalTreeMap`, and `buildPersonalTree(workspace: WorkspaceData): PersonalTreeMap`.
- Consumes: existing `WorkspaceData`, `SkillNode`, and `SkillEdge` types.

- [ ] **Step 1: Write failing graph-builder tests**

Create fixtures proving that an empty workspace produces only ME, two categories coexist, ME connects to both categories, a root skill connects to its category, and a dependent skill retains its skill-to-skill edge. Assert literal node IDs and edge endpoints.

```ts
const map = buildPersonalTree(workspace)
expect(map.nodes.map((node) => node.id)).toEqual([
  'personal-root:me',
  'personal-category:fitness',
  'personal-category:license',
  'fitness-start',
  'fitness-30-days',
])
expect(map.edges.map(({ source, target }) => [source, target])).toEqual([
  ['personal-root:me', 'personal-category:fitness'],
  ['personal-root:me', 'personal-category:license'],
  ['personal-category:fitness', 'fitness-start'],
  ['fitness-start', 'fitness-30-days'],
])
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- --run src/utils/personalTree.test.ts`

Expected: FAIL because `personalTree.ts` and its exports do not exist.

- [ ] **Step 3: Add view-node types and graph builder**

Define derived nodes with reserved IDs and distinct `me`/`category` types. Place ME at `{ x: 0, y: 0 }`; distribute categories around ME on a radius using their stable array order. Build derived edges before appending persisted dependency edges. Add category-to-skill edges only for skills with zero local prerequisites.

```ts
export type MeNode = Node<{ label: 'ME' }, 'me'>
export type CategoryNode = Node<{ categoryId: string; name: string; coinName: string; coins: number }, 'category'>
export type PersonalTreeNode = MeNode | CategoryNode | SkillNode

export const buildPersonalTree = (workspace: WorkspaceData): PersonalTreeMap => {
  // ME + category nodes + persisted skills
  // ME/category and category/root-skill edges + persisted skill edges
}
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `npm test -- --run src/utils/personalTree.test.ts`

Expected: all personal-tree tests PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/types/skillTree.ts src/utils/personalTree.ts src/utils/personalTree.test.ts
git commit -m "Build derived personal skill map graph"
```

### Task 2: Render ME and categories inside the React Flow canvas

**Files:**
- Create: `src/components/CategoryNode.tsx`
- Modify: `src/components/mobile/MeRoot.tsx`
- Modify: `src/components/SkillTreeCanvas.tsx`
- Modify: `src/styles.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `PersonalTreeMap` and `PersonalTreeNode` from Task 1.
- Produces: a single canvas capable of rendering `me`, `category`, and `skill` nodes while forwarding mutations only for persisted skills and dependency edges.

- [ ] **Step 1: Write a failing UI test for derived canvas nodes**

Update the existing Tree test to expect `me-root`, both category node test IDs, and skills from 운동 and 공부 inside the same `ME personal skill map canvas`. Remove tab-based expectations.

```ts
const canvas = screen.getByRole('region', { name: 'ME personal skill map canvas' })
expect(within(canvas).getByTestId('me-root')).toBeInTheDocument()
expect(within(canvas).getByTestId('category-node-fitness')).toHaveTextContent('운동')
expect(within(canvas).getByTestId('category-node-study')).toHaveTextContent('공부')
expect(within(canvas).getByTestId('skill-node-fitness-start')).toBeInTheDocument()
expect(within(canvas).getByTestId('skill-node-study-start')).toBeInTheDocument()
```

- [ ] **Step 2: Run the UI test and verify RED**

Run: `npm test -- --run src/App.test.tsx -t "personal skill map"`

Expected: FAIL because the current UI renders a category tab and per-category canvas.

- [ ] **Step 3: Implement derived canvas node renderers and mutation filtering**

Convert `MeRoot` to a React Flow node renderer with source handles and the future avatar slot. Add `CategoryNode` with target/source handles, category name, coin label, and coin count. Register all three node types in `SkillTreeCanvas`.

Filter `NodeChange<PersonalTreeNode>[]` to IDs whose node type is `skill` before calling `onNodesChange`. Filter edge removal changes so only persisted skill dependency edge IDs reach `onEdgesChange`. Keep connect events valid only when both endpoints are skill IDs; derived handles are marked non-connectable.

- [ ] **Step 4: Style the ME and category nodes for a radial mind-map hierarchy**

Keep ME visually dominant with a circular avatar area. Give categories a separate pill/card silhouette between ME and skill cards. Use readable edge colors and preserve the mobile minimum canvas height.

- [ ] **Step 5: Run the UI test and verify GREEN**

Run: `npm test -- --run src/App.test.tsx -t "personal skill map"`

Expected: the combined-canvas UI test PASSes.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/components/CategoryNode.tsx src/components/mobile/MeRoot.tsx src/components/SkillTreeCanvas.tsx src/styles.css src/App.test.tsx
git commit -m "Render ME and categories in skill canvas"
```

### Task 3: Replace category tabs with the unified Tree page

**Files:**
- Modify: `src/components/mobile/TreePage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `buildPersonalTree(workspace)` and the expanded `SkillTreeCanvas` from Tasks 1–2.
- Produces: one Tree page with all branches and existing skill selection/edit behavior.

- [ ] **Step 1: Write failing integration tests**

Assert that Tree has no `Tree selection` tablist, shows all categories simultaneously, selects a skill from either category, and after Reset Tree still renders ME as the only graph node.

- [ ] **Step 2: Run the integration tests and verify RED**

Run: `npm test -- --run src/App.test.tsx -t "personal skill map|resets all data"`

Expected: FAIL on current category-tab behavior or old empty-state structure.

- [ ] **Step 3: Implement the unified Tree page**

Remove `selectedCategoryId`, category selection, tabs, and per-category filtering from `TreePage`. Build one `PersonalTreeMap`, show a compact aggregate coin summary only when categories exist, and always render `SkillTreeCanvas`.

Update the TreePage call in `App.tsx` to match the smaller prop surface while leaving category selection in forms and workspace state for creation defaults.

- [ ] **Step 4: Run the integration tests and verify GREEN**

Run: `npm test -- --run src/App.test.tsx -t "personal skill map|resets all data"`

Expected: all targeted integration tests PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/components/mobile/TreePage.tsx src/App.tsx src/App.test.tsx
git commit -m "Show one unified personal skill tree"
```

### Task 4: Complete regression verification and delivery

**Files:**
- Modify only files required by verified review findings.

**Interfaces:**
- Consumes: completed unified map implementation.
- Produces: reviewed, verified commits pushed to `origin/main`.

- [ ] **Step 1: Run full verification**

```bash
npm test -- --run
npm run build
git diff --check
```

Expected: every test passes, Vite production build exits 0, and diff check emits no errors.

- [ ] **Step 2: Review requirements against the final diff**

Verify ME is always present, categories are first-level branches, category root skills receive derived edges, persisted dependencies remain skill-to-skill, there are no category tabs, and version-2 storage is unchanged.

- [ ] **Step 3: Resolve Critical or Important review findings**

For each valid finding, add a failing regression test, verify RED, apply the minimal fix, and rerun the focused plus full suites. Leave unrelated cleanup out of scope.

- [ ] **Step 4: Push the verified branch**

```bash
git status --short --branch
env -u GITHUB_TOKEN git push origin main
git rev-parse HEAD
env -u GITHUB_TOKEN git ls-remote origin refs/heads/main
```

Expected: local HEAD equals remote `refs/heads/main` and the worktree is clean.
