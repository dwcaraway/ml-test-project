# Tasks: Frontend File Explorer View & Breadcrumb Navigation

**Feature**: Frontend File Explorer View & Breadcrumb Navigation
**Feature Directory**: `specs/003-file-explorer-view`
**Input Documents**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md), [contracts/file-explorer.contract.md](contracts/file-explorer.contract.md), [research.md](research.md), [quickstart.md](quickstart.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: API client contracts, data models, and global navigation links.

- [X] T001 [P] Define `FileSystemItem` and `BrowseResponse` interfaces and implement `fetchBrowseDirectory` API client function in `frontend/src/api.ts`
- [X] T002 [P] Add `Files` navigation link pointing to `/files` in `NavbarComponent` in `frontend/src/components/navbar.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core router enhancement to decouple pathname matching from query parameters and preserve search strings in history navigation.

**⚠️ CRITICAL**: No user story work can begin until this foundational phase is complete.

- [X] T003 [P] Write unit tests in `frontend/tests/router-query.test.ts` verifying `Router` route matching with query parameters (e.g. `/files?path=docs`) and history synchronization
- [X] T004 Enhance `Router` in `frontend/src/core/router.ts` to decouple pathname matching from query parameters, preserve query strings in `pushState`/`replaceState`, and maintain search parameters on internal link clicks

**Checkpoint**: Foundation ready — router supports query parameters and history navigation. User story implementation can begin.

---

## Phase 3: User Story 1 - Directory Browsing MVP (Priority: P1) 🎯 MVP

**Goal**: Allow users to visit `/files`, query the backend API (`/api/browse`), and view files and directories with schema-compliant sizes (`"-"` for folders, byte count for files), with loading and empty state handling.

**Independent Test**: Navigate to `/files`; verify that root items are displayed with correct names and sizes (`"-"` for folders), and verify loading and empty states render appropriately.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T005 [P] [US1] Write unit tests in `frontend/tests/components/file-list.test.ts` verifying table rendering, folder size `"-"`, file byte count display, and empty directory state
- [X] T006 [P] [US1] Write integration tests in `frontend/tests/views/file-explorer-view.test.ts` verifying `FileExplorerView` loading lifecycle, API data binding, and error notification banner

### Implementation for User Story 1

- [X] T007 [US1] Implement `FileListComponent` in `frontend/src/components/file-list.ts` rendering semantic table with name, size (`"-"` for folders), and empty-state messaging
- [X] T008 [US1] Implement `FileExplorerView` in `frontend/src/views/file-explorer-view.ts` managing fetch lifecycle, loading indicator, and error banner with retry option
- [X] T009 [US1] Register `/files` route mapping to `FileExplorerView` in `frontend/src/main.ts` and verify initial root rendering in end-to-end test

**Checkpoint**: User Story 1 fully functional and independently testable as the core directory browsing MVP.

---

## Phase 4: User Story 2 - Folder Navigation & Dynamic Breadcrumbs (Priority: P2)

**Goal**: Enable users to click folder rows to navigate into subdirectories, update URL query parameter (`/files?path=...`), display breadcrumbs for non-root folders (`Home > ...`), collapse intermediate segments when depth > 3 (`Home > ... > current`), expand `...` inline on click, and navigate when clicking breadcrumbs.

**Independent Test**: Click a folder in the table; verify URL updates to `/files?path={folder}` and breadcrumb appears. Navigate deeper than 3 levels; verify `Home > ... > leaf` collapses, clicking `...` expands the trail inline, and clicking an ancestor segment navigates to that directory.

### Tests for User Story 2

- [X] T010 [P] [US2] Write unit tests in `frontend/tests/components/breadcrumb.test.ts` verifying breadcrumb hiding at root, segment rendering, `Home` root label, collapsing when depth > 3, and inline expansion on clicking `...`
- [X] T011 [P] [US2] Write integration tests in `frontend/tests/views/file-explorer-navigation.test.ts` verifying folder row click navigation, URL query parameter updates, and breadcrumb segment clicking

### Implementation for User Story 2

- [X] T012 [US2] Implement `BreadcrumbComponent` in `frontend/src/components/breadcrumb.ts` with `Home` root label, depth collapsing (`depth > 3`), and inline `...` expansion toggle
- [X] T013 [US2] Integrate `BreadcrumbComponent` and folder row click handlers into `FileExplorerView` in `frontend/src/views/file-explorer-view.ts` triggering `router.navigate('/files?path=' + targetPath)` and history synchronization

**Checkpoint**: User Stories 1 and 2 work independently and together. Directory browsing and full multi-level breadcrumb navigation verified.

---

## Phase 5: User Story 3 - File Download Link (Priority: P3)

**Goal**: Display an accessible download link beside each file item targeting `/api/download?path={filePath}`, omit download links for folders, and trigger direct file streaming.

**Independent Test**: Locate a file row in the listing; verify the presence of a download link targeting `/api/download?path={filePath}` with a `download` attribute, and verify folder rows have no download link.

### Tests for User Story 3

- [X] T014 [P] [US3] Write unit tests in `frontend/tests/components/file-download.test.ts` verifying presence of download links on file rows, absence on folder rows, and correct URL encoding of `/api/download?path=...`

### Implementation for User Story 3

- [X] T015 [US3] Add download action column and anchor links `<a href="/api/download?path={filePath}" download="{name}">` to `FileListComponent` in `frontend/src/components/file-list.ts`

**Checkpoint**: All user stories fully implemented. Directory browsing, breadcrumb navigation, and direct file downloads functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification, linting, formatting, documentation, and end-to-end quickstart execution.

- [X] T016 [P] Run full frontend test suite via `npm test` in `frontend/` to ensure zero regressions across all component and view tests
- [X] T017 [P] Verify TypeScript static type checking passes cleanly via `npm run typecheck` in `frontend/`
- [X] T018 [P] Run production build via `npm run build` in `frontend/` and restore `backend/wwwroot/.gitkeep`
- [X] T019 Execute full validation workflow following `specs/003-file-explorer-view/quickstart.md`
- [X] T020 [P] Update project documentation in `README.md` to document the new `/files` route, File Explorer view, and breadcrumb navigation per Constitution Principle VIII

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Stories (Phases 3–5)**: All depend on Foundational phase completion.
  - Can proceed sequentially in priority order (P1 → P2 → P3) or in parallel.
- **Polish (Phase 6)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start immediately after Foundational (Phase 2). Delivers standalone MVP.
- **User Story 2 (P2)**: Depends on Foundational (Phase 2) and integrates with `FileExplorerView` from US1.
- **User Story 3 (P3)**: Depends on Foundational (Phase 2) and enhances `FileListComponent` from US1.

---

## Parallel Opportunities

### Parallel Setup & Foundation
```bash
# Launch Phase 1 parallel tasks:
Task T001: "Define FileSystemItem and BrowseResponse interfaces and implement fetchBrowseDirectory in frontend/src/api.ts"
Task T002: "Add Files navigation link in frontend/src/components/navbar.ts"

# Launch Phase 2 parallel tasks:
Task T003: "Write unit tests in frontend/tests/router-query.test.ts"
```

### Parallel User Story Tests
```bash
Task T005: "Write unit tests in frontend/tests/components/file-list.test.ts"
Task T006: "Write integration tests in frontend/tests/views/file-explorer-view.test.ts"
Task T010: "Write unit tests in frontend/tests/components/breadcrumb.test.ts"
Task T014: "Write unit tests in frontend/tests/components/file-download.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup (`T001`–`T002`)
2. Complete Phase 2: Foundational (`T003`–`T004`)
3. Complete Phase 3: User Story 1 (`T005`–`T009`)
4. **STOP and VALIDATE**: Verify `/files` loads directory contents with folder sizes `"-"` and loading/empty states.

### Incremental Delivery
1. Foundation Ready (`T001`–`T004`) &rarr; API client models and router query support proven.
2. User Story 1 (`T005`–`T009`) &rarr; Directory browsing functional (MVP!).
3. User Story 2 (`T010`–`T013`) &rarr; Multi-level folder navigation and collapsing/expanding breadcrumbs functional.
4. User Story 3 (`T014`–`T015`) &rarr; Direct file streaming download links functional.
5. Polish (`T016`–`T020`) &rarr; Full test suite, typechecking, build verification, and README documentation verified.
