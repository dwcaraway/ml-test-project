# Tasks: File Explorer Item Counts and Secure Deletion

**Feature**: File Explorer Item Counts and Secure Deletion
**Feature Directory**: `specs/004-item-deletion-and-counts`
**Input Documents**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md), [contracts/delete-api.contract.md](contracts/delete-api.contract.md), [research.md](research.md), [quickstart.md](quickstart.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: API client contracts, data models, and shared client infrastructure.

- [ ] T001 [P] Define `DeleteResponse` interface and implement `deleteItem` API client function in `frontend/src/api.ts`
- [ ] T002 [P] Add unit tests in `frontend/tests/api.test.ts` verifying `deleteItem` request formatting and error message extraction

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend service abstraction required before deletion endpoint and service implementation.

**⚠️ CRITICAL**: Must complete before User Story 3 server implementation.

- [ ] T003 [P] Add `DeleteItem` method signature to `IFileBrowserService` in `backend/Services/IFileBrowserService.cs`

**Checkpoint**: Foundational interface ready — user stories can proceed.

---

## Phase 3: User Story 1 - Folder and File Counts Summary (Priority: P1) 🎯 MVP

**Goal**: Count the number of folders and the number of files (excluding folders) on the current directory results and display this summary at the bottom of the File Explorer view (`Folders: X | Files: Y`).

**Independent Test**: Navigate to `/files`; verify that the bottom of the view displays the accurate count of folders and files matching the displayed items, and displays `Folders: 0 | Files: 0` for an empty directory.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T004 [P] [US1] Write unit tests in `frontend/tests/views/file-explorer-view.test.ts` verifying folder count and file count calculation and footer display across mixed, folder-only, file-only, and empty directory states

### Implementation for User Story 1

- [ ] T005 [US1] Implement item counter calculation and render `.file-counts-footer` element at the bottom of the view in `frontend/src/views/file-explorer-view.ts`

**Checkpoint**: User Story 1 fully functional and independently testable as the core counts MVP.

---

## Phase 4: User Story 2 - Safe Item Deletion with Confirmation (Priority: P2)

**Goal**: Provide a visible "Delete" link to the right of files and folders in the Actions column. Clicking delete prompts the user with an unrecoverable action warning (`window.confirm`). If confirmed, delete the item via `deleteItem`, remove it from the view, and decrement the counters immediately without a full page reload.

**Independent Test**: Click the delete action for a file or folder; verify a prompt appears warning that the action is not recoverable. Cancel the prompt and verify the item remains. Click delete again, confirm the prompt, and verify the item disappears from the table and the bottom counters update immediately.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T006 [P] [US2] Write unit tests in `frontend/tests/components/file-list.test.ts` verifying presence of `.delete-link` in the Actions column for both folder rows and file rows, and triggering `onDeleteClick` callback
- [ ] T007 [P] [US2] Write integration tests in `frontend/tests/views/file-explorer-delete.test.ts` verifying confirmation prompt (`window.confirm`), prompt cancellation, successful deletion item removal, counter decrement, and failure error banner

### Implementation for User Story 2

- [ ] T008 [US2] Update `FileListComponent` in `frontend/src/components/file-list.ts` to add `.delete-link` to the Actions column for both folders and files and wire `onDeleteClick` callback
- [ ] T009 [US2] Implement deletion confirmation prompt (`window.confirm`), `deleteItem` invocation, item removal from `items`, dynamic count recomputation, and error handling in `frontend/src/views/file-explorer-view.ts`

**Checkpoint**: User Stories 1 and 2 work independently and together. Users can view counts and safely delete items with confirmation.

---

## Phase 5: User Story 3 - Secure Server Deletion Endpoint with Boundary Protection (Priority: P3)

**Goal**: Provide a secure `DELETE /api/delete?path=...` endpoint in the backend Web API that deletes files and directories, validates that paths remain strictly within the storage root directory, prevents directory traversal (`..`), protects the root folder, and performs recursive folder deletion.

**Independent Test**: Issue DELETE requests to `/api/delete` for files, directories, traversal paths (`../`), and root; verify 200 on success, 400 on traversal/root, and 404 on missing item.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US3] Write unit tests in `backend/TestProject.Tests/Services/FileBrowserServiceTests.cs` verifying `DeleteItem` path traversal validation, root directory protection, file deletion, and recursive directory deletion
- [ ] T011 [P] [US3] Write integration tests in `backend/TestProject.Tests/Integration/DeleteEndpointTests.cs` verifying `DELETE /api/delete` endpoint status codes (`200 OK`, `400 Bad Request`, `404 Not Found`)

### Implementation for User Story 3

- [ ] T012 [US3] Implement `DeleteItem` in `backend/Services/FileBrowserService.cs` with path canonicalization, root directory check, file deletion, and recursive directory deletion (`Directory.Delete(fullPath, recursive: true)`)
- [ ] T013 [US3] Implement `Delete` endpoint in `backend/Controllers/FileBrowserController.cs` mapping `DELETE /api/delete` to `_fileBrowserService.DeleteItem` with exception mapping (`SecurityException` / `ArgumentException` to 400, `FileNotFoundException` to 404)

**Checkpoint**: All user stories fully implemented. Backend secure deletion endpoint and frontend safe deletion workflow fully functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification, linting, formatting, documentation, and end-to-end quickstart execution.

- [ ] T014 [P] Run full frontend test suite via `npm test` in `frontend/` to ensure zero regressions across all component and view tests
- [ ] T015 [P] Verify TypeScript static type checking passes cleanly via `npm run typecheck` in `frontend/`
- [ ] T016 [P] Run full backend test suite via `dotnet test` in `backend/` to ensure zero regressions
- [ ] T017 [P] Run production build via `npm run build` in `frontend/` and restore `backend/wwwroot/.gitkeep`
- [ ] T018 Execute full validation workflow following `specs/004-item-deletion-and-counts/quickstart.md`
- [ ] T019 [P] Update project documentation in `README.md` to document the `DELETE /api/delete` endpoint, item counts footer, and deletion confirmation workflow per Constitution Principle VIII

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — provides backend service interface.
- **User Story 1 (Phase 3)**: Depends on Phase 1 — independent frontend MVP.
- **User Story 2 (Phase 4)**: Depends on Phase 1 & Phase 3 — enhances `FileListComponent` and `FileExplorerView`.
- **User Story 3 (Phase 5)**: Depends on Phase 2 — implements backend deletion service and endpoint.
- **Polish (Phase 6)**: Depends on all user stories (Phases 3–5) being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Independent of US2/US3. Delivers standalone folder and file counts.
- **User Story 2 (P2)**: Integrates with US1 counts footer. Can be tested with mock API client before US3 is complete.
- **User Story 3 (P3)**: Independent backend service and endpoint. Can be tested with xUnit tests before or in parallel with frontend stories.

---

## Parallel Opportunities

### Parallel Setup & Foundational
```bash
# Launch Phase 1 parallel tasks:
Task T001: "Define DeleteResponse interface and implement deleteItem in frontend/src/api.ts"
Task T002: "Add unit tests in frontend/tests/api.test.ts"

# Launch Phase 2 task:
Task T003: "Add DeleteItem method signature to IFileBrowserService in backend/Services/IFileBrowserService.cs"
```

### Parallel Tests Across Stories
```bash
Task T004: "Write unit tests for counts in frontend/tests/views/file-explorer-view.test.ts"
Task T006: "Write unit tests for delete links in frontend/tests/components/file-list.test.ts"
Task T007: "Write integration tests in frontend/tests/views/file-explorer-delete.test.ts"
Task T010: "Write unit tests in backend/TestProject.Tests/Services/FileBrowserServiceTests.cs"
Task T011: "Write integration tests in backend/TestProject.Tests/Integration/DeleteEndpointTests.cs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup (`T001`–`T002`)
2. Complete Phase 3: User Story 1 (`T004`–`T005`)
3. **STOP and VALIDATE**: Verify `/files` renders `Folders: X | Files: Y` at the bottom of the table.

### Incremental Delivery
1. Foundation Ready (`T001`–`T003`) &rarr; API client models and backend service contracts ready.
2. User Story 1 (`T004`–`T005`) &rarr; Folder and file count footer functional (MVP!).
3. User Story 2 (`T006`–`T009`) &rarr; Frontend delete links, confirmation dialogs, and immediate count decrementation functional.
4. User Story 3 (`T010`–`T013`) &rarr; Backend `DELETE /api/delete` endpoint with path traversal protection functional.
5. Polish (`T014`–`T019`) &rarr; Full test suites, typechecking, build verification, and README documentation verified.
