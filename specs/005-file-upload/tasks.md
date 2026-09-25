# Tasks: File Upload with Conflict Renaming and Size Limits

**Feature**: File Upload with Conflict Renaming and Size Limits  
**Feature Directory**: `specs/005-file-upload`  
**Input Documents**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md), [contracts/upload-api.contract.md](contracts/upload-api.contract.md), [research.md](research.md), [quickstart.md](quickstart.md)  

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: API client contracts, data models, and shared client/server infrastructure.

- [ ] T001 [P] Define `UploadResponse` interface and implement `uploadFile` API client function in `frontend/src/api.ts`
- [ ] T002 [P] Create `UploadResultDto.cs` model in `backend/Models/UploadResultDto.cs` with `FileName`, `Path`, `SizeBytes`, and `Message` properties

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend service abstraction required before upload endpoint and service implementation.

**⚠️ CRITICAL**: Must complete before User Story 1 server implementation.

- [ ] T003 [P] Add `UploadFileAsync` method signature to `IFileBrowserService` in `backend/Services/IFileBrowserService.cs`

**Checkpoint**: Foundational interface ready — user stories can proceed.

---

## Phase 3: User Story 1 - Secure File Upload via Web API with Conflict Resolution (Priority: P1) 🎯 MVP

**Goal**: Implement backend service and `POST /api/upload` endpoint to receive `multipart/form-data` uploads, validate destination paths within the storage boundary, enforce max 8 MB size limit, and resolve filename collisions non-destructively using sequential `_copyN` suffixes.

**Independent Test**: Issue `POST /api/upload` requests with files under 8 MB, files over 8 MB, colliding filenames, and path traversal attempts; verify 200 OK on success, 400 Bad Request on traversal or >8MB, 404 on missing target directory, and automatic creation of `_copy1`, `_copy2` files without overwriting existing files.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T004 [P] [US1] Write unit tests in `backend/TestProject.Tests/Services/FileBrowserServiceTests.cs` verifying `UploadFileAsync` destination path traversal validation, missing folder check, max 8 MB size check, and sequential `_copyN` conflict renaming
- [ ] T005 [P] [US1] Write integration tests in `backend/TestProject.Tests/Integration/UploadEndpointTests.cs` verifying `POST /api/upload` endpoint status codes (`200 OK`, `400 Bad Request`, `404 Not Found`) and multipart upload handling

### Implementation for User Story 1

- [ ] T006 [US1] Implement `UploadFileAsync` in `backend/Services/FileBrowserService.cs` with path resolution, 8 MB limit validation (`file.Length <= 8 * 1024 * 1024`), collision detection loop (`_copy1`, `_copy2`, etc.), and file stream writing
- [ ] T007 [US1] Implement `Upload` endpoint in `backend/Controllers/FileBrowserController.cs` mapping `POST /api/upload` to `_fileBrowserService.UploadFileAsync` with structured exception handling (`SecurityException`/`ArgumentException` to 400, `DirectoryNotFoundException` to 404)

**Checkpoint**: User Story 1 fully functional and independently testable as the core upload & conflict resolution MVP.

---

## Phase 4: User Story 2 - Upload Action and System File Picker in File Explorer (Priority: P2)

**Goal**: Render an Upload button above and to the right of the File Explorer view in the header, wire a hidden file input to invoke the OS default file picker, upload the chosen file to the current viewing folder, add the new item to the file list, and immediately increment the file counter in the footer without a page refresh.

**Independent Test**: Navigate to any folder (`/files` or `/files?path=docs`); click the Upload button; select a valid file from the file picker; verify the file appears in the list table and the bottom summary increments `Files: Y` by 1.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T008 [P] [US2] Write unit tests in `frontend/tests/api.test.ts` verifying `uploadFile` FormData construction, query parameter encoding, and error response handling
- [ ] T009 [P] [US2] Write integration tests in `frontend/tests/views/file-explorer-upload.test.ts` verifying presence of `.upload-btn` in `.explorer-header`, programmatic triggering of the file input, upload dispatch to current directory, table row addition, and footer file count increment

### Implementation for User Story 2

- [ ] T010 [US2] Update `FileExplorerView` in `frontend/src/views/file-explorer-view.ts` to add the `.upload-btn` to the explorer header, append hidden file input, trigger file dialog, and handle successful upload by updating `items` and re-rendering content and footer counts

**Checkpoint**: User Stories 1 and 2 work together. Users can upload files via the browser UI and see immediate list/count updates.

---

## Phase 5: User Story 3 - Transparent Conflict Notification & Size Validation Feedback (Priority: P3)

**Goal**: Provide instant client-side size pre-validation (rejecting > 8 MB files before network transmission), display accessible error banners on upload failure (server 400/404/500 or network error), and ensure files renamed via conflict resolution (`_copyN`) are clearly rendered in the UI with the counter incremented.

**Independent Test**: Select a file > 8 MB and verify an immediate error banner appears without sending an upload request; select a file that conflicts with an existing file name and verify both original and `_copyN` files appear in the list with the counter incremented by 1.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T011 [P] [US3] Add tests in `frontend/tests/api.test.ts` verifying `uploadFile` client-side size pre-validation throws when file size strictly exceeds 8 MB (8,388,608 bytes)
- [ ] T012 [P] [US3] Add integration tests in `frontend/tests/views/file-explorer-upload.test.ts` verifying client-side >8 MB rejection banner, server failure error banner, and conflict-renamed item rendering

### Implementation for User Story 3

- [ ] T013 [US3] Implement client-side size pre-validation check and error banner display (`.error-banner.upload-error`) in `FileExplorerView` in `frontend/src/views/file-explorer-view.ts`

**Checkpoint**: All user stories fully implemented. Users receive instant size validation, clear failure feedback, and transparent collision renaming.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification, linting, formatting, documentation, and end-to-end quickstart execution.

- [ ] T014 [P] Run full frontend test suite via `npm test` in `frontend/` to ensure zero regressions across all component and view tests
- [ ] T015 [P] Verify TypeScript static type checking passes cleanly via `npm run typecheck` in `frontend/`
- [ ] T016 [P] Run full backend test suite via `dotnet test` in `backend/` to ensure zero regressions
- [ ] T017 [P] Run production build via `npm run build` in `frontend/` and restore `backend/wwwroot/.gitkeep`
- [ ] T018 Execute full validation workflow following `specs/005-file-upload/quickstart.md`
- [ ] T019 [P] Update project documentation in `README.md` to document the `POST /api/upload` endpoint, 8 MB limit, `_copyN` conflict renaming, and upload UI feature per Constitution Principle VIII

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — provides backend service interface.
- **User Story 1 (Phase 3)**: Depends on Phase 2 — core backend upload service & endpoint MVP.
- **User Story 2 (Phase 4)**: Depends on Phase 1 & Phase 3 — adds frontend UI and end-to-end upload interaction.
- **User Story 3 (Phase 5)**: Depends on Phase 4 — adds client-side size pre-validation and conflict UI feedback.
- **Polish (Phase 6)**: Depends on all user stories (Phases 3–5) being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Independent backend foundation. Delivers complete API upload and conflict resolution capability.
- **User Story 2 (P2)**: Integrates with US1 backend endpoint and existing explorer view. Can be mocked for client testing.
- **User Story 3 (P3)**: Enhances US2 with size pre-checks and error feedback.

---

## Parallel Opportunities

### Parallel Setup & Foundational
```bash
# Launch Phase 1 parallel tasks:
Task T001: "Define UploadResponse interface and implement uploadFile in frontend/src/api.ts"
Task T002: "Create UploadResultDto.cs model in backend/Models/UploadResultDto.cs"

# Launch Phase 2 task:
Task T003: "Add UploadFileAsync method signature to IFileBrowserService in backend/Services/IFileBrowserService.cs"
```

### Parallel Tests Across Stories
```bash
Task T004: "Write unit tests in backend/TestProject.Tests/Services/FileBrowserServiceTests.cs"
Task T005: "Write integration tests in backend/TestProject.Tests/Integration/UploadEndpointTests.cs"
Task T008: "Write unit tests in frontend/tests/api.test.ts"
Task T009: "Write integration tests in frontend/tests/views/file-explorer-upload.test.ts"
Task T011: "Add tests in frontend/tests/api.test.ts for size pre-validation"
Task T012: "Add integration tests in frontend/tests/views/file-explorer-upload.test.ts for error banners"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup (`T001`–`T002`)
2. Complete Phase 2: Foundational (`T003`)
3. Complete Phase 3: User Story 1 (`T004`–`T007`)
4. **STOP and VALIDATE**: Verify `POST /api/upload` handles uploads, 8 MB limit, path traversal, and `_copyN` conflict renaming via automated integration tests.

### Incremental Delivery
1. Foundation Ready (`T001`–`T003`) &rarr; API client models and backend service contracts ready.
2. User Story 1 (`T004`–`T007`) &rarr; Backend upload API with conflict renaming functional (MVP!).
3. User Story 2 (`T008`–`T010`) &rarr; Frontend upload button, file picker dialog, and dynamic count increment functional.
4. User Story 3 (`T011`–`T013`) &rarr; Client 8 MB validation, error banners, and conflict display verified.
5. Polish (`T014`–`T019`) &rarr; Full test suites, typechecks, build verification, and README documentation verified.
