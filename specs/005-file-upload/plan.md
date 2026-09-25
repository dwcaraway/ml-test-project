# Implementation Plan: File Upload with Conflict Renaming and Size Limits

**Branch**: `005-file-upload` | **Date**: 2026-09-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-file-upload/spec.md`

## Summary

Implement a full-stack file upload capability with client and server size enforcement (max 8 MB), automatic non-destructive conflict renaming (`_copy1`, `_copy2`, ...), strict storage boundary protection, and responsive frontend UI updates (Upload link positioned top-right of File Explorer view, invoking native file picker, and immediately incrementing the file counter).

## Technical Context

**Language/Version**: C# (.NET 8.0) backend; TypeScript 5+ frontend  
**Primary Dependencies**: ASP.NET Core 8 Web API (`IFormFile`), Vite 8, native DOM Web APIs (`FormData`, `<input type="file">`)  
**Storage**: Local server filesystem scoped strictly within configured `FILE_BROWSER_ROOT` (default `./storage`)  
**Testing**: Vitest + happy-dom for frontend component & integration tests; xUnit + `Microsoft.AspNetCore.Mvc.Testing` (`TestAppFactory`) for backend unit and integration tests  
**Target Platform**: Cross-platform (.NET 8 runtime & modern web browsers)  
**Project Type**: Full-stack web application (REST API + Vanilla TypeScript SPA)  
**Performance Goals**: Direct asynchronous file stream writing (`CopyToAsync`) without memory buffering; instant client-side size pre-validation; in-place DOM/counter updates without full page reloads  
**Constraints**: Maximum 8 MB (`8,388,608 bytes`) file size; non-destructive conflict renaming; strict path traversal prevention (`..`)  
**Scale/Scope**: Single-file upload per user interaction; full frontend and backend integration  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I: Zero-Framework Vanilla TypeScript SPA**: PASS. Uses standard HTML `<input type="file">` triggered programmatically via vanilla TypeScript DOM APIs. No third-party UI libraries.
- **Principle II: Strict Client-Side Rendering & JSON Web API Boundary**: PASS. ASP.NET Core exposes `POST /api/upload` returning JSON `UploadResponseDto`. HTML rendering and state management are 100% client-side.
- **Principle III: Architectural Boundaries & Workspace Segregation**: PASS. Backend logic is contained in `backend/Controllers/` and `backend/Services/`. Frontend logic is contained in `frontend/src/api.ts` and `frontend/src/views/`. No cross-boundary leakage.
- **Principle IV: Simplicity, Readability & Function Over Styling (KISS)**: PASS. Clear flexbox layout in `.explorer-header`, simple deterministic conflict increment loop, minimal CSS styling.
- **Principle V: High Performance Standards**: PASS. Non-blocking asynchronous stream writing directly to disk; fast client pre-check before upload dispatch.
- **Principle VI: Mandatory Automated Testing, Linting & Tooling Compliance**: PASS. Comprehensive xUnit unit & integration tests and Vitest component/view tests. All builds and typechecks clean.
- **Principle VII: Clarification Over Assumption**: PASS. All requirements are explicit; no open ambiguities.
- **Principle VIII: Documentation Currency (Keep README.md Up to Date)**: PASS. `README.md` will be updated to document `POST /api/upload`, size limits, conflict postfix rules, and upload UI interactions.

## Project Structure

### Documentation (this feature)

```text
specs/005-file-upload/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── upload-api.contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── Controllers/
│   └── FileBrowserController.cs         # Add Upload endpoint handling POST /api/upload
├── Models/
│   └── UploadResultDto.cs               # Add UploadResultDto (fileName, path, sizeBytes, message)
├── Services/
│   ├── IFileBrowserService.cs           # Add UploadFileAsync interface method
│   └── FileBrowserService.cs            # Implement UploadFileAsync with 8 MB check, path validation, and conflict renaming
└── TestProject.Tests/
    ├── Integration/
    │   └── UploadEndpointTests.cs       # Integration tests for /api/upload (success, conflict renaming, >8MB rejection, traversal)
    └── Services/
        └── FileBrowserServiceTests.cs   # Unit tests for UploadFileAsync conflict renaming and boundary guards

frontend/
├── src/
│   ├── api.ts                           # Add UploadResponse interface and uploadFile API client function
│   └── views/
│       └── file-explorer-view.ts        # Add Upload button to header, wire file picker, client 8 MB check, and list/count update
└── tests/
    ├── api.test.ts                      # Unit tests for uploadFile client function and size pre-validation
    └── views/
        └── file-explorer-upload.test.ts # Integration tests for upload button, file picker trigger, list update, counter increment, and error banners
```

**Structure Decision**:
Follows the established full-stack modular architecture. Extends `FileBrowserController` and `FileBrowserService` in `backend/` to handle file uploads, conflict resolution, and boundary enforcement. Extends `api.ts` and `FileExplorerView` in `frontend/` to support the upload button, native file picker trigger, and immediate list/counter updates.

## Complexity Tracking

*No violations. All design elements adhere strictly to project constitution principles.*
