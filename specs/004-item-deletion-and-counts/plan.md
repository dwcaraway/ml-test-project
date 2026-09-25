# Implementation Plan: File Explorer Item Counts and Secure Deletion

**Branch**: `004-item-deletion-and-counts` | **Date**: 2026-09-25 | **Spec**: [specs/004-item-deletion-and-counts/spec.md](spec.md)

**Input**: Feature specification from `specs/004-item-deletion-and-counts/spec.md`

## Summary

Enhance the File Explorer view in the vanilla TypeScript single-page application and the ASP.NET Core backend Web API to support item counting and safe deletion:
1. **Frontend Item Counter Footer**: Compute the number of folders and files (excluding folders) in the current directory view and display this summary at the bottom of the File Explorer view (`Folders: X | Files: Y`).
2. **Backend Secure Deletion API**: Add `DELETE /api/delete?path=...` in `FileBrowserController` and `FileBrowserService` to permanently delete files or directories while strictly validating against the storage root, enforcing directory traversal protection (`..`), and protecting the root container itself.
3. **Safe UI Deletion Action with Prompt**: Add a delete link to the right of files and folders in the table's Actions column. Clicking delete prompts the user with an unrecoverable action warning (`window.confirm`). Upon confirmation, call the deletion endpoint, remove the item from the view, and immediately update the folder and file counts.

## Technical Context

**Language/Version**: C# (.NET 8.0 SDK) / TypeScript 5.4 (Native Browser DOM APIs)

**Primary Dependencies**: None for frontend (Zero-Framework Vanilla TypeScript SPA, Vite 5 build tool, Vitest 5 testing). ASP.NET Core 8 Web API for backend.

**Storage**: Local file system managed via `FILE_BROWSER_ROOT` environment variable (default `./storage`).

**Testing**: Vitest 1.3 (`happy-dom`) for frontend component and view tests; xUnit and `Microsoft.AspNetCore.Mvc.Testing` for backend controller and service tests.

**Target Platform**: Evergreen desktop and mobile web browsers; cross-platform .NET 8 runtime.

**Project Type**: Full-Stack Web Application (Frontend Client SPA + Backend REST Web API).

**Performance Goals**: < 100ms local DOM updates after deletion, immediate synchronous counter updates, non-blocking asynchronous server deletion (< 500ms).

**Constraints**: Zero-Framework Vanilla TypeScript (Constitution Principle I), Strict Client-Side Rendering & JSON Web API Boundary (Principle II), Architectural Boundaries (Principle III), KISS (Principle IV), Mandatory Automated Testing (Principle VI), Documentation Currency (Principle VIII).

**Scale/Scope**: Current page item listings (up to 100 items per directory), arbitrary nested folder hierarchies, safe deletion without memory leaks or path traversal.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Zero-Framework Vanilla TypeScript SPA)**: **PASS**. Counts footer, delete links, and confirmation warnings are implemented using native DOM elements and standard `window.confirm`. No third-party UI framework or modal library.
- **Principle II (Strict Client-Side Rendering & JSON Web API Boundary)**: **PASS**. HTML is generated strictly client-side in the browser. The server exposes a RESTful JSON endpoint (`DELETE /api/delete`) returning structured JSON messages and errors.
- **Principle III (Architectural Boundaries & Workspace Segregation)**: **PASS**. Backend code modifications strictly contained within `backend/TestProject/` and `backend/TestProject.Tests/`. Frontend code modifications strictly contained within `frontend/src/` and `frontend/tests/`. No cross-boundary logic leakage.
- **Principle IV (Simplicity, Readability & Function Over Styling - KISS)**: **PASS**. Native confirmation prompt, simple counter element below the table, and clean delete links in the Actions column.
- **Principle V (High Performance Standards)**: **PASS**. In-memory filter count over current items (O(N)), single-item DOM removal on deletion, and non-blocking asynchronous file/directory removal on the server.
- **Principle VI (Mandatory Automated Testing, Linting & Tooling Compliance)**: **PASS**. Full Vitest test coverage for frontend item counters, confirmation prompt handling, and view updates; xUnit unit and integration tests for backend `/api/delete` endpoint and path traversal prevention. Zero warnings/errors on `npm run typecheck`, `npm test`, and `dotnet test`.
- **Principle VII (Clarification Over Assumption)**: **PASS**. Requirements are explicit and unambiguous regarding counter scope (current page results, files not including folders), deletion path safety, and unrecoverable confirmation prompts.
- **Principle VIII (Documentation Currency)**: **PASS**. `README.md` will be updated synchronously with API documentation for `/api/delete` and frontend usage instructions.

## Project Structure

### Documentation (this feature)

```text
specs/004-item-deletion-and-counts/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── delete-api.contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── Controllers/
│   └── FileBrowserController.cs         # Add Delete endpoint handling DELETE /api/delete
├── Services/
│   ├── IFileBrowserService.cs           # Add DeleteItem interface method
│   └── FileBrowserService.cs            # Implement DeleteItem with path validation and recursive folder deletion
└── TestProject.Tests/
    ├── Controllers/
    │   └── FileBrowserControllerTests.cs # Unit tests for Delete controller endpoint
    ├── Integration/
    │   └── DeleteEndpointTests.cs       # Integration tests for /api/delete (success, traversal, 404, root protection)
    └── Services/
        └── FileBrowserServiceTests.cs   # Unit tests for DeleteItem method and path traversal guards

frontend/
├── src/
│   ├── api.ts                           # Add deleteItem API client function
│   ├── components/
│   │   └── file-list.ts                 # Add delete links to Actions column and onItemDelete callback
│   └── views/
│       └── file-explorer-view.ts        # Add folder & file counter footer and deletion confirmation handler
└── tests/
    ├── components/
    │   └── file-list.test.ts            # Tests for delete links and onDeleteClick callback
    └── views/
        └── file-explorer-view.test.ts   # Tests for counter footer, delete confirmation, and view update
```

**Structure Decision**:
Follows the established full-stack architecture. Adds the `DELETE /api/delete` route to the existing `FileBrowserController` and `FileBrowserService` in `backend/`. Extends `api.ts`, `FileListComponent`, and `FileExplorerView` in `frontend/src/` to support delete links, confirmation dialogs, and the count footer.

## Complexity Tracking

*No violations. All design elements adhere strictly to project constitution principles.*
