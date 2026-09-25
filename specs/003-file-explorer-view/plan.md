# Implementation Plan: Frontend File Explorer View & Breadcrumb Navigation

**Branch**: `003-file-explorer-view` | **Date**: 2026-09-24 | **Spec**: [specs/003-file-explorer-view/spec.md](file:///C:/Users/dwcar/repos/ml-test-project/specs/003-file-explorer-view/spec.md)

**Input**: Feature specification from `specs/003-file-explorer-view/spec.md`

## Summary

Implement a responsive, accessible File Explorer view in the vanilla TypeScript single-page application. The view queries the backend API (`GET /api/browse?path=...`) to display directory listings with item names and schema-compliant sizes (`"-"` for folders, byte count for files). Files include a direct download link targeting `GET /api/download?path=...`. Clicking a folder navigates into it and updates the browser URL query parameter (`/files?path=...`). A dynamic breadcrumb trail renders at the top of non-root folders, displaying `Home` for the root, and when depth exceeds 3 levels below root, collapsing to `Home > ... > (current folder name)` with an interactive `...` button that expands intermediate levels inline.

## Technical Context

**Language/Version**: TypeScript 5.4 / Native Browser Web APIs (DOM, History, URL)

**Primary Dependencies**: None (Zero-Framework Vanilla TypeScript; built with Vite 5)

**Storage**: Browser `window.history` / `URLSearchParams` for deep linking; server-side storage accessed via REST API

**Testing**: Vitest 1.3 (`jsdom` environment) for component, view, and router integration tests

**Target Platform**: Evergreen desktop and mobile web browsers (Chromium, Firefox, WebKit)

**Project Type**: Single-Page Application (Frontend client module)

**Performance Goals**: < 100ms local DOM render on directory navigation, zero memory leaks during repeated navigation, non-buffering direct streaming downloads

**Constraints**: Pure vanilla TypeScript without external UI frameworks (Constitution Principle I), strict client-side rendering (Principle II), lightweight semantic styling (Principle IV)

**Scale/Scope**: Handles directory listings with up to 100 items per page and arbitrarily deep nested folder hierarchies

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Zero-Framework Vanilla TypeScript SPA)**: **PASS**. All views, breadcrumbs, and tables are implemented in pure vanilla TypeScript using native DOM elements. No React, Vue, or third-party component libraries.
- **Principle II (Strict Client-Side Rendering & JSON Web API Boundary)**: **PASS**. HTML is generated strictly client-side. The view consumes the RESTful JSON endpoint (`/api/browse`) and downloads via `/api/download`.
- **Principle III (Architectural Boundaries & Workspace Segregation)**: **PASS**. All changes are contained within `frontend/src/` and `frontend/tests/`. No backend modifications or cross-boundary leakage.
- **Principle IV (Simplicity, Readability & Function Over Styling - KISS)**: **PASS**. Clean, accessible semantic HTML tables and breadcrumb navigation with minimal CSS focused on usability.
- **Principle V (High Performance Standards)**: **PASS**. Fast DOM manipulation, clean listener detachment on `unmount()`, and direct stream downloads.
- **Principle VI (Mandatory Automated Testing, Linting & Tooling Compliance)**: **PASS**. Full Vitest test coverage for breadcrumb truncation, folder navigation, download links, and router query handling. Zero TypeScript compilation errors (`tsc --noEmit`).
- **Principle VII (Clarification Over Assumption)**: **PASS**. All 3 clarifications (Root name "Home", ellipsis inline expansion, and query parameter URL navigation) resolved with user.
- **Principle VIII (Documentation Currency)**: **PASS**. `README.md` will document the `/files` route, File Explorer view, and breadcrumb behavior upon completion.

## Project Structure

### Documentation (this feature)

```text
specs/003-file-explorer-view/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── file-explorer.contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── api.ts                           # API client with fetchBrowseDirectory and types
│   ├── components/
│   │   ├── breadcrumb.ts                # BreadcrumbComponent with collapsing & inline expansion
│   │   ├── file-list.ts                 # FileListComponent with table, '-' folder size, download links
│   │   ├── hero-card.ts                 # Existing HeroCard component
│   │   └── navbar.ts                    # Updated NavbarComponent with '/files' navigation link
│   ├── core/
│   │   ├── component.ts                 # BaseComponent abstract class
│   │   ├── router.ts                    # Updated Router with query string preservation & route matching
│   │   ├── types.ts                     # Core router & view contracts
│   │   └── view.ts                      # BaseView abstract class
│   ├── views/
│   │   ├── file-explorer-view.ts        # New FileExplorerView handling path state & fetching
│   │   ├── detail-view.ts               # Existing DetailView
│   │   ├── home-view.ts                 # Existing HomeView
│   │   └── not-found-view.ts            # Existing NotFoundView
│   └── main.ts                          # App initialization registering '/files' route
└── tests/
    ├── components/
    │   ├── breadcrumb.test.ts           # Tests for breadcrumb segments, collapsing (>3), and expansion
    │   └── file-list.test.ts            # Tests for table rendering, '-' folder size, and download link
    ├── views/
    │   └── file-explorer-view.test.ts   # Integration tests for FileExplorerView loading & navigation
    └── router-query.test.ts             # Tests for Router query parameter handling and history sync
```

**Structure Decision**:
Follows the existing component-and-view architecture in `frontend/src/`. Extends `core/router.ts` to support query string preservation, creates reusable `BreadcrumbComponent` and `FileListComponent` under `components/`, and implements `FileExplorerView` under `views/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations. All design elements adhere strictly to project constitution principles.*
