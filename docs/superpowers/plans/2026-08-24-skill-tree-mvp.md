# Skill Tree MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a working personal skill-tree editor with editable React Flow graphs, prerequisite locking, multiple trees, and resilient local persistence.

**Architecture:** A versioned workspace is owned by one React hook. Components render focused UI regions, while pure utility functions perform all graph transformations, validation, status computation, and storage parsing.

**Tech Stack:** Vite, React 19, TypeScript, @xyflow/react, Vitest, Testing Library, CSS, localStorage

**Spec:** `docs/superpowers/specs/2026-08-24-skill-tree-mvp-design.md`

## Global Constraints

- Desktop/Chromebook-first dark functional UI; no game assets or advanced animation.
- No backend, database, login, or additional product features.
- Persist trees, names, nodes, positions, edges, skill data, and active tree.
- Reject self, duplicate, and cyclic dependencies.
- Clamp `maxLevel >= 1` and `0 <= level <= maxLevel`.

---

### Task 1: Project Foundation and Domain Engine

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`
- Create: `src/types/skillTree.ts`, `src/utils/skillLogic.ts`, `src/data/defaultTree.ts`
- Test: `src/utils/skillLogic.test.ts`

**Interfaces:**
- Produces `WorkspaceData`, `SkillTree`, `SkillData`, `recalculateTree`, `addDependency`, `removeDependency`, `deleteSkill`, `wouldCreateCycle`, and `createDefaultWorkspace`.

- [ ] Write literal-fixture tests for one and multiple prerequisite unlock rules, deletion cleanup, duplicate/self/cycle rejection, and level normalization.
- [ ] Run `npm test -- --run src/utils/skillLogic.test.ts` and confirm failure because the domain modules do not exist.
- [ ] Implement the minimal types and pure functions to satisfy those behaviors.
- [ ] Re-run the focused tests and confirm they pass.

### Task 2: Persistence and Workspace State

**Files:**
- Create: `src/utils/storage.ts`, `src/hooks/useSkillTrees.ts`
- Test: `src/utils/storage.test.ts`

**Interfaces:**
- Consumes domain types and normalization from Task 1.
- Produces `loadWorkspace(storage)`, `saveWorkspace(storage, workspace)`, and hook actions for tree/skill/edge mutations.

- [ ] Write tests proving a valid workspace round-trips and malformed or structurally invalid JSON returns the demo workspace.
- [ ] Run the focused storage test and confirm expected failures.
- [ ] Implement versioned parse/serialize validation and the workspace action hook with automatic saving.
- [ ] Re-run storage and domain tests and confirm they pass.

### Task 3: React Flow UI and Editing

**Files:**
- Create: `src/components/SkillNode.tsx`, `src/components/SkillTreeCanvas.tsx`, `src/components/SkillEditor.tsx`, `src/components/TreeSidebar.tsx`, `src/components/TopBar.tsx`
- Create: `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes all hook actions from Task 2.
- Produces the complete interactive screen and user-visible controls.

- [ ] Write Testing Library tests proving “Add Skill” adds a selectable New Skill and “New Tree” creates and activates an independent tree.
- [ ] Run the app tests and confirm expected failures because UI modules do not exist.
- [ ] Implement focused components, custom nodes with handles, canvas callbacks, editor controls, and responsive desktop CSS.
- [ ] Re-run all tests and confirm they pass.

### Task 4: Edge Cases and Verification

**Files:**
- Modify only files implicated by verification failures.

**Interfaces:**
- Consumes the complete application.
- Produces a tested production bundle.

- [ ] Run `npm test -- --run` and resolve any failure without weakening assertions.
- [ ] Run `npm run build` and resolve all TypeScript or bundling failures.
- [ ] Inspect the final file tree and implementation against every completion flow in the spec.
