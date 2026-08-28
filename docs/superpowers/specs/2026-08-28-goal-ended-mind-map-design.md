# Goal-Ended Personal Mind Map Design

## Goal

Make Tree behave as one personal mind map: the user-name circle is the center, categories are its first branches, user-defined skills fill each branch, and every category's required final goal remains at the outer end. Remove the current coin economy while retaining quests as simple daily check-offs.

## Graph Model

- The user-name node remains the single derived center node.
- Each category is a derived first-level node connected to the user-name node.
- Every category stores a non-empty `finalGoal` string.
- A derived final-goal node is rendered for every category and cannot be deleted, connected manually, or moved into the middle of a branch.
- Skills remain persisted nodes. Skills without prerequisites connect from their category. Persisted skill dependencies form the middle of the branch.
- Every skill with no dependent skill in the same category connects to that category's final-goal node.
- A category with no skills connects directly to its final-goal node.
- Multiple terminal skills may converge on the same final goal, allowing a mind-map branch to split while keeping the goal at the outer end.

## Creation and Editing

- Category creation requires both a category name and a final goal. The submit button stays disabled until both values are non-empty.
- Creating a category atomically creates the complete visible branch `user → category → final goal`.
- Skills are added through the existing skill form. Choosing no prerequisite creates a new branch from the category; choosing a prerequisite extends that skill's branch.
- Adding or deleting a skill automatically recalculates which terminal skills connect to the final goal.
- Category settings allow editing both the category name and final goal.
- Existing skill and category deletion behavior remains, including removal of category-owned quests and skills.

## Coin Removal and Quest Behavior

- Remove category coin names and balances, quest coin rewards, skill coin requirements, coin feedback, progress displays, and unlock actions.
- Remove locked/available/unlocked states. Skills are neutral planning nodes rather than purchasable nodes.
- Quests retain title, category, and daily completion date. Completing a quest toggles it complete for the current day without granting a reward.
- Today continues to group quests by category and shows simple completion controls.

## Persistence and Migration

- Persist workspaces as schema version 3 under a version-3 storage key.
- Version-3 categories contain `id`, `name`, and `finalGoal`.
- Version-3 quests contain `id`, `categoryId`, `title`, and `completedDate`.
- Version-3 skill data contains `id`, `name`, `description`, `categoryId`, and `prerequisiteIds`.
- Load valid version-2 workspaces from the existing key when no version-3 workspace exists. Preserve user name, categories, quests, skills, edges, positions, descriptions, prerequisites, and completion dates while discarding all coin and unlock fields.
- Migrated categories receive `finalGoal: "최종목표"` because version 2 did not contain goal information. Users can edit it in settings.
- Invalid saved data falls back to the empty default workspace.

## Layout and Presentation

- Category direction remains stable using the existing deterministic radial direction.
- The final-goal node sits farther from the center than the category and its terminal skills. With multiple terminal branches, its position follows the category's radial axis and incoming edges converge on it.
- User, category, skill, and final-goal nodes have visually distinct circular or rounded treatments; edges retain the mind-map branch presentation.
- All coin summaries and labels are removed from Tree, Today, forms, detail sheets, and settings.

## Testing

- Category creation requires a final goal and renders `user → category → final goal`.
- Root skills appear between category and final goal; dependent skills extend the path and only terminal skills connect to the final goal.
- Multiple terminal skills converge on the category final goal.
- Quest completion remains a daily boolean/date check and does not mutate categories or skills.
- Version-2 data migrates without losing categories, quests, skills, edges, or positions and drops coin/unlock fields.
- Category and final-goal editing, skill operations, deletion, reset, storage round-trip, full tests, and production build pass.
