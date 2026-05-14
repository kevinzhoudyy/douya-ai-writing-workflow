# Repository Guidelines

## Project Structure & Module Organization
This repository is a local article editor focused on rebuilding a single generated editor page from source scripts and upstream writing assets.

- `rebuild-html.js`: main generator. Rebuilds the editor HTML and `preset-articles.json`.
- `start.js`: local dev server, file watcher, and save API.
- `editor-styles.js`: theme/style definitions used by the generator.
- `emoji-features.js`: emoji and editor-side enhancement logic.
- `豆芽编辑器.html`: generated editor output. Do not hand-edit.
- `screenshots/`, `generated-images/`: local preview and image assets.

The editor also reads article/image sources from external sibling folders under `~/WorkBuddy/Claw/公众号写作/` and `~/WorkBuddy/Claw/小红书/`.

## Build, Test, and Development Commands
- `node rebuild-html.js`: rebuild the generated editor and article preset data.
- `node start.js`: start the local server at `http://localhost:8765`, enable file watching, and expose the save API.
- `node --check rebuild-html.js`
- `node --check start.js`: quick syntax validation for key scripts.

There is no real automated test suite yet. `npm test` is a placeholder and currently fails by design.

## Coding Style & Naming Conventions
Use 2-space indentation and keep code in plain CommonJS-style Node.js. Prefer small helper functions over large inline blocks.

- File names are mostly descriptive and script-oriented, for example `rebuild-html.js` and `resize-xhs.js`.
- Preserve existing Chinese content/file names where they already represent article assets.
- Keep generated artifacts out of manual edits; change the generator instead.

## Testing Guidelines
For changes to editor behavior, verify both:

- rebuild path: run `node rebuild-html.js`
- runtime path: run `node start.js` and manually refresh the editor

Check for regressions in article loading, theme persistence, toolbar behavior, save flow, and image rendering. If a change affects generated output, confirm the HTML rebuild reflects it correctly.

## Commit & Pull Request Guidelines
Follow the existing history style: short imperative English summaries, for example `Persist article theme selection` or `Stabilize editor rebuild pipeline`.

Before opening a PR or handing off work:

- summarize user-visible changes
- list manual verification performed
- include screenshots for UI changes
- call out any edits that touch external article directories or generated files

## Agent-Specific Notes
Do not patch `豆芽编辑器.html` directly unless the task is explicitly about the generated file. The durable source of truth is `rebuild-html.js` plus its supporting modules.
