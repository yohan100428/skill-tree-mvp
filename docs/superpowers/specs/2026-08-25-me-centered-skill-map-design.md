# ME-Centered Personal Skill Map Design

## Goal

Replace the category-tab interpretation of Tree with one personal mind map. `ME` is always the center root, categories such as 운동 or 자격증 branch directly from ME, and skills branch from their category or from prerequisite skills.

## Experience

- A new workspace opens Tree with only the ME node.
- Creating a category adds a first-level branch connected to ME.
- Creating a skill without a prerequisite connects it to its category.
- Creating a skill with a prerequisite connects it to that skill.
- Every category and skill is visible on one pannable and zoomable canvas. There are no category tabs or separate per-category canvases.
- Selecting a skill retains the existing detail, edit, unlock, and delete flows.
- Category creation and management retain the existing forms and settings flows.
- ME is visually distinct and keeps a dedicated avatar area for future character customization.

## Data and Graph Model

Persisted workspace data remains version 2. Categories continue to be domain records and skills continue to be React Flow nodes. ME and category nodes are derived view nodes, so existing saved user data requires no migration.

The canvas graph is assembled as follows:

1. Add one fixed ME view node.
2. Add one category view node per workspace category.
3. Add an edge from ME to every category.
4. Add every persisted skill node.
5. For a skill with no prerequisite, add a derived edge from its category node to that skill.
6. Preserve persisted skill-to-skill dependency edges.

Derived node identifiers use reserved prefixes so they cannot collide with persisted skill IDs. Derived nodes are not passed to persistence mutations.

## Layout and Interaction

The initial automatic layout places ME at the center, distributes categories radially around it, and places each category's skill levels farther outward along the same branch. Persisted skill positions remain authoritative after users drag skills. ME and category nodes are not removable or connectable; skills remain draggable and connectable.

The canvas fits the entire personal map on entry. Empty state guidance appears near ME without replacing it.

## Component Boundaries

- `TreePage` renders a single canvas and the aggregate category balance summary.
- A graph-builder utility creates derived ME/category nodes and edges without mutating persisted workspace data.
- `SkillTreeCanvas` supports ME, category, and skill node renderers and only forwards skill selection and mutation events.
- Dedicated ME and category node components own their visual presentation.

## Safety and Errors

- Skill dependency validation remains unchanged.
- Deleting a category still removes its quests, skills, and skill edges; the derived category branch disappears automatically.
- Malformed or missing category references remain rejected by existing storage validation.
- Fresh and reset workspaces continue to contain no categories, quests, skills, or edges; ME is derived at render time.

## Testing

- A fresh Tree shows one ME node and no category or skill nodes.
- Multiple categories appear simultaneously and each connects to ME.
- Root skills connect to their category; dependent skills connect to their prerequisite.
- Existing skill selection, drag, connect, add, delete, reset, and storage behavior remains green.
- Production TypeScript and Vite builds pass.
