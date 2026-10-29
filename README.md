# Concord

A calm workspace for turning ideas into finished work. Built with React, TypeScript, and Vite.

## Contributor

[**arpitkjaiswal**](https://github.com/arpitkjaiswal) — project owner and contributor.

## Get started

Use Node.js 24 (see `.nvmrc`), then run these commands from the repository root:

```sh
npm ci
npm run dev
```

The development server uses port 5173. No environment variables, API keys, accounts, or backend services are required. Fonts are bundled locally, so the application makes no external API or font requests.

## Features

- Create projects with descriptions and a choice of colors.
- Create, edit, and delete tasks, with deletion confirmation.
- Set status, priority, due date, description, and assignee.
- Move tasks between four board columns by dragging, or use the status selector in the editor or list view.
- Search task titles, descriptions, assignees, and references (`CON-1`); combine search with project and priority filters.
- Switch between board and list views, or see completed tasks.
- Track task counts and completion rate for each project.
- Use the workspace on mobile, including project creation and selection.
- Search with Ctrl/Cmd+K and dismiss dialogs with Escape.

The initial workspace includes **sample projects and tasks** so you can explore immediately. Your first edit saves the workspace to this browser’s local storage (`concord.workspace.v1`). Reloading keeps saved tasks and projects.

**This is a local, single-browser application.** Assignee names are labels, not user accounts. Data is not shared across devices, browser profiles, or teammates. Clearing site data removes the workspace. There is no cloud sync, authentication, backend database, or real-time collaboration. Multiple open tabs are not synchronized; use one tab for editing.

If saved data is malformed or unreadable, the app shows sample data for the session and preserves the original stored data. If saving fails, a warning explains that changes are only held for the current session.

## Validation

```sh
npm test               # Domain logic and saved-data validation
npm run build          # TypeScript check and production bundle
npm run test:e2e       # Browser tests against the production build
```

Run the build before the browser tests. Browser tests automatically start and stop a preview server on port 4173, and use `/usr/bin/chromium` when available. Otherwise install Playwright’s Chromium with `npx playwright install chromium`. For another system Chromium path, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to that executable. Keep TLS and artifact verification enabled when installing browsers.

The browser suite covers project/task creation, editing, list and board views, drag and drop, filters, deletion confirmation, reload persistence, corrupted storage, mobile layout, and keyboard behavior. Each test uses an isolated browser context.

To inspect the production build manually:

```sh
npm run preview
```

## Project structure

```text
src/App.tsx          Application views, dialogs, and persistence
src/model.ts         Types, sample data, filtering, and data validation
src/styles.css       Responsive interface styles
tests/model.test.ts  Domain tests using Node’s test runner
tests/e2e/           Playwright browser tests
```
