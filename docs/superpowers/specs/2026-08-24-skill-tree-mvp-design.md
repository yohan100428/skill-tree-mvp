# Skill Tree MVP Design

## Goal

Build a desktop-first personal skill-tree editor where users can create independent trees, freely position and connect skills, and see dependent skills lock or unlock from prerequisite completion. Persist the complete workspace in localStorage.

## Architecture

Use Vite, React, TypeScript, `@xyflow/react`, and CSS. `App` composes a tree sidebar, top bar, React Flow canvas, and selected-skill editor. A `useSkillTrees` hook owns the workspace document and exposes focused mutation actions. React Flow remains a view/input layer; pure functions in `skillLogic.ts` validate and transform tree data.

## Data Model

- `WorkspaceData`: schema version, trees, and active tree id.
- `SkillTree`: id, editable name, React Flow nodes, and edges.
- `SkillData`: id, name, description, level, maxLevel, computed status, and prerequisite ids.
- Edge direction is prerequisite source to dependent target.
- Node positions live on React Flow nodes and are persisted with all other data.

## Status Rules

Completed nodes remain completed and have `level === maxLevel`. Other nodes with any missing or incomplete prerequisite are locked. Unblocked nodes with level zero are available; unblocked nodes with a positive level below max are in progress. Invalid prerequisite ids are ignored safely. Every structural or skill mutation normalizes levels and recomputes all non-completed statuses.

## Tree Operations

Users can create, select, rename, and delete trees. Deleting the last tree creates a fresh replacement so the app always has an active canvas. New trees start empty; first launch or malformed storage loads a demo Engineering tree.

Users can add, edit, move, complete, and delete skills. Deleting a skill also removes connected edges and prerequisite references. Connecting nodes rejects self-connections, duplicate edges, and any connection that would introduce a directed cycle. Removing an edge removes the source prerequisite from its target.

## Persistence and Recovery

Serialize the whole workspace to one versioned localStorage key after state changes. Restore through structural validation and normalization. Missing, malformed, or unsupported data falls back to a fresh demo workspace rather than crashing.

## UI

Use a dark, functional three-column shell: compact tree sidebar, flexible map canvas, and fixed editor panel, with a top bar above the canvas/editor. Nodes show name, level, and status with distinct brightness/colors. React Flow supplies pan, wheel zoom, node drag, connection handles, edge selection/deletion, minimap, controls, and background.

## Error Handling

Invalid connections are ignored and briefly reported in the top bar. Numeric inputs are clamped to valid ranges. Broken edge references and prerequisite ids are removed during normalization. Destructive actions use native confirmation for tree deletion; skill deletion is immediate from the explicit editor button.

## Testing

Vitest tests pure status, connection, deletion, cycle, normalization, and storage recovery logic. Testing Library covers the main user-visible flow: adding a skill and switching/creating trees. Final verification runs the entire test suite and `npm run build` with no TypeScript errors.

## Out of Scope

No backend, authentication, social features, recommendations, achievements, quests, advanced analytics, sound, game art, mobile app, or elaborate animation.
