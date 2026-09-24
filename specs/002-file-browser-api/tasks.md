# Tasks: File & Directory Browsing Web API

**Feature**: File & Directory Browsing Web API
**Feature Directory**: `specs/002-file-browser-api`
**Input Documents**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md), [contracts/file-browser-api.contract.md](contracts/file-browser-api.contract.md), [research.md](research.md), [quickstart.md](quickstart.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configuration options, storage initialization, and data transfer models.

- [X] T001 [P] Create initial storage directory layout at `./storage` with sample files and folders for local testing in repository root
- [X] T002 [P] Create strongly-typed configuration model in `backend/Configuration/FileBrowserOptions.cs` binding `FILE_BROWSER_ROOT` environment variable with `./storage` fallback
- [X] T003 [P] Implement DTO models in `backend/Models/BrowseRequest.cs`, `backend/Models/BrowseResponse.cs`, and `backend/Models/FileSystemItemDto.cs` enforcing `size: "-"` for folders and byte count string for files

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core service contracts and path traversal security that MUST be complete before user story endpoints can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this foundational phase is complete.

- [X] T004 [P] Define service contract interface `IFileBrowserService` in `backend/Services/IFileBrowserService.cs` defining browse, download, and path resolution signatures
- [X] T005 Implement canonical path resolution and traversal security logic in `backend/Services/FileBrowserService.cs` ensuring resolved paths never escape root
- [X] T006 [P] Write unit tests in `backend/TestProject.Tests/Services/FileBrowserServiceTests.cs` verifying path normalization and rejection of traversal attempts (`../`, `..\\`)

**Checkpoint**: Foundation ready — secure path resolution verified. User story implementation can begin.

---

## Phase 3: User Story 1 - Directory Browsing with Pagination (Priority: P1) 🎯 MVP

**Goal**: Allow clients to browse files and directories under the home root via paginated JSON endpoint with schema-compliant names and sizes (`"-"` for folders).

**Independent Test**: Send `GET /api/browse?path=&page=1&pageSize=50`; verify response contains items with `name` and `size` (`"-"` for folders), pagination metadata, and 404 for nonexistent paths.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T007 [P] [US1] Write integration tests in `backend/TestProject.Tests/Integration/BrowseEndpointTests.cs` testing `GET /api/browse` for root, subfolders, pagination limits (`page`, `pageSize`), and 404 for nonexistent paths

### Implementation for User Story 1

- [X] T008 [US1] Implement directory enumeration, sorting (folders first, then alphabetical by name), and pagination (`Skip/Take`) in `backend/Services/FileBrowserService.cs`
- [X] T009 [US1] Implement `FileBrowserController` in `backend/Controllers/FileBrowserController.cs` exposing `GET /api/browse` with `BrowseRequest` query parameters
- [X] T010 [US1] Register `IFileBrowserService` in `backend/Program.cs` and verify `GET /api/browse` endpoint in end-to-end integration test

**Checkpoint**: User Story 1 fully functional and independently testable as the core browsing MVP.

---

## Phase 4: User Story 2 - File Downloading (Priority: P2)

**Goal**: Allow clients to download specific files located within the home directory tree as binary streams with appropriate headers.

**Independent Test**: Send `GET /api/download?path=test.txt`; verify binary stream download with `Content-Disposition` header, and verify 400 Bad Request when attempting to download a directory.

### Tests for User Story 2

- [X] T011 [P] [US2] Write integration tests in `backend/TestProject.Tests/Integration/DownloadEndpointTests.cs` verifying file download streaming, Content-Disposition header, 404 for missing files, and 400 for directory paths

### Implementation for User Story 2

- [X] T012 [US2] Implement secure file resolution and MIME type lookup using `FileExtensionContentTypeProvider` in `backend/Services/FileBrowserService.cs`
- [X] T013 [US2] Add `GET /api/download` endpoint to `backend/Controllers/FileBrowserController.cs` returning `PhysicalFileResult` with `enableRangeProcessing: true`

**Checkpoint**: User Stories 1 and 2 work independently and together. Directory browsing and file retrieval verified.

---

## Phase 5: User Story 3 - Configurable Home Directory & Startup Validation (Priority: P3)

**Goal**: Configure home root directory via `FILE_BROWSER_ROOT` and verify read/write access at startup, failing fast if inaccessible.

**Independent Test**: Start server with invalid or read-only `FILE_BROWSER_ROOT`; verify that the server throws a fatal `InvalidOperationException` and terminates process initialization before accepting traffic.

### Tests for User Story 3

- [X] T014 [P] [US3] Write unit and integration tests in `backend/TestProject.Tests/Integration/StartupValidationTests.cs` verifying successful probe execution on valid directories and fail-fast exception on unwritable/invalid directories

### Implementation for User Story 3

- [X] T015 [US3] Implement `FileBrowserStartupValidator` in `backend/Services/FileBrowserStartupValidator.cs` performing active read/write probe (`.probe_{guid}.tmp`)
- [X] T016 [US3] Wire startup validation in `backend/Program.cs` before `app.Run()`, throwing fatal `InvalidOperationException` if verification fails

**Checkpoint**: All user stories fully implemented. Configurable root and fail-fast startup protection verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification, linting, formatting, documentation, and end-to-end quickstart execution.

- [X] T017 [P] Run full test suite via `dotnet test backend/TestProject.sln` to ensure zero regressions across all integration and unit tests
- [X] T018 [P] Verify code formatting and compiler analyzer checks pass cleanly via `dotnet build backend/TestProject.sln`
- [X] T019 Execute full validation workflow following `specs/002-file-browser-api/quickstart.md`
- [X] T020 [P] Update project documentation in `README.md` to document new API endpoints (`/api/browse`, `/api/download`) and environment variable `FILE_BROWSER_ROOT` per Constitution Principle VIII

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
- **User Story 2 (P2)**: Depends on Foundational (Phase 2) and integrates with `FileBrowserController` from US1.
- **User Story 3 (P3)**: Depends on Foundational (Phase 2) and configures root directory options used by US1/US2.

---

## Parallel Opportunities

### Parallel Setup & Foundation
```bash
# Launch Phase 1 parallel tasks:
Task T001: "Create initial storage directory layout at ./storage in repository root"
Task T002: "Create strongly-typed configuration model in backend/Configuration/FileBrowserOptions.cs"
Task T003: "Implement DTO models in backend/Models/"

# Launch Phase 2 parallel tasks:
Task T004: "Define service contract interface in backend/Services/IFileBrowserService.cs"
Task T006: "Write unit tests in backend/TestProject.Tests/Services/FileBrowserServiceTests.cs"
```

### Parallel User Story Tests
```bash
Task T007: "Write integration tests in backend/TestProject.Tests/Integration/BrowseEndpointTests.cs"
Task T011: "Write integration tests in backend/TestProject.Tests/Integration/DownloadEndpointTests.cs"
Task T014: "Write tests in backend/TestProject.Tests/Integration/StartupValidationTests.cs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup (`T001`–`T003`)
2. Complete Phase 2: Foundational (`T004`–`T006`)
3. Complete Phase 3: User Story 1 (`T007`–`T010`)
4. **STOP and VALIDATE**: Verify `GET /api/browse` returns paginated directory listings with correct folder sizes (`"-"`) and path traversal protection.

### Incremental Delivery
1. Foundation Ready (`T001`–`T006`) → Storage models and secure path resolution proven.
2. User Story 1 (`T007`–`T010`) → Directory browsing with pagination functional (MVP!).
3. User Story 2 (`T011`–`T013`) → File streaming download functional.
4. User Story 3 (`T014`–`T016`) → `FILE_BROWSER_ROOT` and startup fail-fast validation functional.
5. Polish (`T017`–`T020`) → Full test suite, compiler checks, and README documentation verified.
