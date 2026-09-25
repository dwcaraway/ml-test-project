# Tasks: Recursive File and Folder Search with Pagination

**Feature**: Recursive File and Folder Search with Pagination  
**Feature Directory**: `specs/006-file-folder-search`  
**Input Documents**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md), [contracts/search-api.contract.md](contracts/search-api.contract.md), [research.md](research.md), [quickstart.md](quickstart.md)  

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared data models, DTOs, and client API interfaces needed across backend and frontend.

- [ ] T001 [P] Create `SearchRequest.cs` query parameter model (`Path`, `Query`, `Page`, `PageSize`) in `backend/Models/SearchRequest.cs`
- [ ] T002 [P] Create `SearchResultItemDto.cs` model (`Name`, `Path`, `Size`, `Type`) in `backend/Models/SearchResultItemDto.cs`
- [ ] T003 [P] Create `SearchResponseDto.cs` payload model (`BasePath`, `Query`, `Page`, `PageSize`, `TotalCount`, `TotalPages`, `Items`) in `backend/Models/SearchResponseDto.cs`
- [ ] T004 [P] Define `SearchItem` and `SearchResponse` TypeScript interfaces and implement `searchFiles` API client function in `frontend/src/api.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend service abstraction required before search endpoint and service implementation.

**⚠️ CRITICAL**: Must complete before User Story 1 server implementation.

- [ ] T005 [P] Add `SearchFilesAsync` method signature to `IFileBrowserService` in `backend/Services/IFileBrowserService.cs`

**Checkpoint**: Foundational interface ready — user stories can proceed.

---

## Phase 3: User Story 1 - Secure Recursive Search via Web API (Priority: P1) 🎯 MVP

**Goal**: Implement backend recursive search engine and `GET /api/search` endpoint to scan file and folder names across all descendant directories, enforce storage root boundary protection (`400 Bad Request` on `..` or traversal), sort results by type (folders first, files second, alphabetical within type), and support pagination slicing (`page`, `pageSize`).

**Independent Test**: Issue `GET /api/search` requests with query substrings, base paths, and traversal attempts; verify 200 OK with matching folders and files sorted by type, 400 Bad Request on empty queries or traversal (`../`), 404 on missing directory, and proper pagination slicing (`totalCount`, `totalPages`, `items`).

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T006 [P] [US1] Write unit tests in `backend/TestProject.Tests/Services/FileBrowserSearchTests.cs` verifying `SearchFilesAsync` recursive subdirectory traversal, case-insensitive partial name matching on item names only, type-based sorting (folders first), pagination slicing, empty query rejection (`VAL-SRCH-003`), and root escape / traversal rejection (`VAL-SRCH-001`)
- [ ] T007 [P] [US1] Write integration tests in `backend/TestProject.Tests/Integration/SearchEndpointTests.cs` verifying `GET /api/search` status codes (`200 OK`, `400 Bad Request`, `404 Not Found`), query parameter binding, and response schema adherence

### Implementation for User Story 1

- [ ] T008 [US1] Implement `SearchFilesAsync` in `backend/Services/FileBrowserService.cs` with path traversal validation against `FILE_BROWSER_ROOT`, recursive filesystem enumeration handling inaccessible directories gracefully, partial name matching against item names only, sorting folders first then files alphabetically, and applying pagination slicing
- [ ] T009 [US1] Implement `Search` endpoint in `backend/Controllers/FileBrowserController.cs` mapping `GET /api/search` to `_fileBrowserService.SearchFilesAsync` with structured exception handling (`SecurityException`/`ArgumentException` to 400, `DirectoryNotFoundException` to 404)

**Checkpoint**: User Story 1 fully functional and independently testable as the core recursive search MVP.

---

## Phase 4: User Story 2 - File Explorer Search Box & Results Navigation (Priority: P2)

**Goal**: In browsing mode, render search input box immediately to the left of the Upload link in the header. When user enters query and submits, transition view to search results mode: place search box above results table, hide the Upload button completely, display matching items (folders show size `"-"`, files show byte size), and when user selects a folder from search results, switch to browse mode displaying that folder's contents and restoring the upload button.

**Independent Test**: In browsing mode, verify search input box is to the left of the upload link; enter a search query and submit; verify upload button is hidden, search box is positioned above results table, matching files and folders display proper names and sizes, and clicking a folder navigates to that folder in browse mode with the upload button restored.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US2] Write unit tests in `frontend/tests/api.test.ts` verifying `searchFiles` query parameter encoding, non-empty query validation, and error response handling
- [ ] T011 [P] [US2] Write component and view tests in `frontend/tests/views/file-explorer-search.test.ts` verifying search box placement to the left of the upload link in browse mode, transition to search mode, upload button removal during search, search results table rendering with name and size, and folder click navigation switching to browse mode

### Implementation for User Story 2

- [ ] T012 [US2] Update `FileExplorerView` in `frontend/src/views/file-explorer-view.ts` to add the search input form to `.header-actions` (positioned to the left of `#upload-file-button`), manage `mode: 'browsing' | 'searching'`, hide the upload button when in search mode, render the search box above the search results table, render search results with type icons and sizes, and implement folder row click handler that switches to browse mode for the selected directory

**Checkpoint**: User Stories 1 and 2 work together. Users can search from the UI, view results without an upload button, and click any folder to browse its contents.

---

## Phase 5: User Story 3 - Search Results Pagination Controls (Priority: P3)

**Goal**: Display numbered pagination options (`1 .. N`) at the bottom of the File Explorer view when search results span multiple pages. Visually highlight the currently selected page and allow the user to click any page number to load and display that specific page of search results.

**Independent Test**: Execute a search matching more items than the page size; verify numbered page buttons `1 .. N` appear at the bottom of the explorer with page 1 active; click page 2; verify page 2 becomes active and the table updates with the second page of matching items.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T013 [P] [US3] Add view tests in `frontend/tests/views/file-explorer-search.test.ts` verifying rendering of pagination controls (`1 .. N`) at the bottom of search results, active page highlighting (`.active` / `aria-current="page"`), and click event dispatching search for the selected page

### Implementation for User Story 3

- [ ] T014 [US3] Implement pagination bar rendering (`#search-pagination` with `1 .. N` buttons) and page change event handlers in `FileExplorerView` in `frontend/src/views/file-explorer-view.ts`, updating the active page selection and rendering the newly fetched results

**Checkpoint**: User Story 3 complete. Users can navigate through large search result sets page by page.

---

## Phase 6: User Story 4 - Global Operation Loading Spinner (Priority: P4)

**Goal**: Display a visible spinning indicator icon during any active asynchronous `search`, `delete`, or `upload` operation before receiving a response; hide the spinning icon when not searching, deleting, or uploading.

**Independent Test**: Trigger a search, a file deletion, and a file upload; verify the spinning icon appears during each request; verify the spinning icon disappears immediately when each request completes (on success or error); verify spinner is hidden when idle.

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T015 [P] [US4] Write integration tests in `frontend/tests/views/file-explorer-spinner.test.ts` verifying `#explorer-spinner` is rendered, becomes visible during active search, delete, and upload requests, and is hidden once the request completes or fails

### Implementation for User Story 4

- [ ] T016 [US4] Add `#explorer-spinner` DOM element and CSS `@keyframes spin` styling in `frontend/src/views/file-explorer-view.ts`, implement centralized `setOperationLoading` state management, and wrap `handleSearch`, `handleDelete`, and `handleFileSelected` with `try ... finally` to ensure the spinner is displayed while requests are in flight and hidden immediately upon response or error

**Checkpoint**: All user stories fully implemented. Users receive continuous visual feedback during all asynchronous operations.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Automated validation across all test suites, linting, formatting, and documentation synchronization.

- [ ] T017 [P] Run full frontend test suite via `npm test` in `frontend/` to ensure zero regressions across all views and components
- [ ] T018 [P] Verify TypeScript static type checking passes cleanly via `npm run typecheck` in `frontend/`
- [ ] T019 [P] Run full backend test suite via `dotnet test` in `backend/` to ensure zero regressions across unit and integration tests
- [ ] T020 [P] Verify .NET code formatting and linting via `dotnet format TestProject.sln --verify-no-changes` in `backend/`
- [ ] T021 Update `README.md` to document the recursive search API endpoint (`GET /api/search`), query parameters, pagination controls (`1 .. N`), UI search box placement, upload button visibility rules, and the global operation loading spinner per Constitution Principle VIII

---

## Dependencies & Execution Order

```
Phase 1: Setup (T001, T002, T003, T004)
        │
        ▼
Phase 2: Foundational (T005)
        │
        ▼
Phase 3: User Story 1 (T006, T007 -> T008, T009) [MVP Complete]
        │
        ▼
Phase 4: User Story 2 (T010, T011 -> T012)
        │
        ▼
Phase 5: User Story 3 (T013 -> T014)
        │
        ▼
Phase 6: User Story 4 (T015 -> T016)
        │
        ▼
Phase 7: Polish & Validation (T017, T018, T019, T020 -> T021)
```

---

## Parallel Execution Opportunities

- **Phase 1**: Tasks T001, T002, T003, and T004 touch independent files and can be executed in parallel.
- **Phase 3 (US1)**: Test tasks T006 and T007 can be written in parallel before implementing T008 and T009.
- **Phase 4 (US2)**: Test tasks T010 and T011 can be written in parallel before implementing T012.
- **Phase 7**: Validation tasks T017, T018, T019, and T020 can run concurrently prior to documentation task T021.

---

## Implementation Strategy

1. **MVP First**: Deliver Phase 1 through Phase 3 (US1) first. This establishes the secure recursive search engine on the backend with full test coverage, path traversal guards, type sorting, and pagination slicing.
2. **Interactive UI Search**: Deliver Phase 4 (US2) to integrate the frontend search box, layout mode transitions, upload button visibility toggling, and folder drill-down into browse mode.
3. **Pagination & Spinner**: Deliver Phase 5 (US3) for `1 .. N` page controls, then Phase 6 (US4) for global spinner feedback across search, delete, and upload.
4. **Validation & Docs**: Finish with Phase 7 to ensure all linting, formatting, automated tests, and `README.md` documentation reflect the complete implementation with zero warnings.
