# Implementation Plan: Recursive File and Folder Search with Pagination

**Branch**: `006-file-folder-search` | **Date**: 2026-09-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-file-folder-search/spec.md`

## Summary

Implement a full-stack recursive search engine across files and folders with partial name matching, type-based sorting (folders first), paginated results (`1 .. N`), path traversal protection against root folder escapes, responsive UI layout adaptation (search box positioned above results in search mode and left of upload in browse mode; upload button hidden in search mode), folder click drill-down into browse mode, and a global asynchronous operation loading spinner for search, delete, and upload operations.

## Technical Context

**Language/Version**: C# (.NET 8.0) backend; TypeScript 5+ frontend  
**Primary Dependencies**: ASP.NET Core 8 Web API, Vite 8, native browser Web APIs (DOM, `fetch`, SVG)  
**Storage**: Server filesystem strictly bounded by `FILE_BROWSER_ROOT` (default `./storage`)  
**Testing**: Vitest + happy-dom for frontend component/view tests; xUnit + `Microsoft.AspNetCore.Mvc.Testing` (`TestAppFactory`) for backend unit and integration tests  
**Target Platform**: Cross-platform (.NET 8 runtime & modern web browsers)  
**Project Type**: Full-stack web application (REST API + Vanilla TypeScript SPA)  
**Performance Goals**: Non-blocking asynchronous filesystem enumeration, low-memory streaming traversal skipping unreadable folders, efficient client DOM rendering with numbered pagination  
**Constraints**: Only match names of files and folders (no content search); folders sorted before files; strict root escape and traversal protection; no third-party frontend frameworks  
**Scale/Scope**: Arbitrary directory nesting depth; paginated delivery up to 100 items per page; responsive feedback on all network operations  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

- **Principle I: Zero-Framework Vanilla TypeScript SPA**: PASS. Built exclusively with vanilla TypeScript DOM elements and native SVG/CSS animations. No third-party UI component libraries or frameworks.
- **Principle II: Strict Client-Side Rendering & JSON Web API Boundary**: PASS. ASP.NET Core endpoint `GET /api/search` returns pure JSON (`SearchResponseDto`). All markup, layout switching, and pagination state are rendered client-side in the browser.
- **Principle III: Architectural Boundaries & Workspace Segregation**: PASS. Backend logic is contained in `backend/Controllers/FileBrowserController.cs`, `backend/Services/FileBrowserService.cs`, and `backend/Models/`. Frontend logic is contained in `frontend/src/api.ts` and `frontend/src/views/file-explorer-view.ts`.
- **Principle IV: Simplicity, Readability & Function Over Styling (KISS)**: PASS. Clean layout transitions using native CSS classes, straightforward recursive folder scanning, simple page button generation (`1 .. N`).
- **Principle V: High Performance Standards**: PASS. File content inspection is strictly bypassed; directory traversal handles I/O exceptions; pagination prevents large payload DOM bloat.
- **Principle VI: Mandatory Automated Testing, Linting & Tooling Compliance**: PASS. Comprehensive test suites in xUnit (unit + integration) and Vitest (unit + component), passing compiler type checks and linters.
- **Principle VII: Clarification Over Assumption**: PASS. Requirements from the specification are explicit and detailed; all edge cases are addressed.
- **Principle VIII: Documentation Currency (Keep README.md Up to Date)**: PASS. `README.md` will be updated to document `GET /api/search`, query parameters, pagination controls, layout modes, and the operation spinner.

## Project Structure

### Documentation (this feature)

```text
specs/006-file-folder-search/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Technical research & design decisions
├── data-model.md        # Entities, DTOs, and state lifecycles
├── quickstart.md        # Runnable verification scenarios
├── contracts/           # API and UI interface contracts
│   └── search-api.contract.md
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Implementation tasks (/speckit-tasks output)
```

### Source Code (repository root)

```text
backend/
├── Controllers/
│   └── FileBrowserController.cs         # Add Search endpoint: GET /api/search
├── Models/
│   ├── SearchRequest.cs                 # Query parameter model: path, query, page, pageSize
│   ├── SearchResponseDto.cs             # Search response payload model: basePath, query, counts, items
│   └── SearchResultItemDto.cs           # Matching item model: name, path, size, type
├── Services/
│   ├── IFileBrowserService.cs           # Add SearchFilesAsync method signature
│   └── FileBrowserService.cs            # Implement recursive traversal, name matching, type sorting, pagination
└── TestProject.Tests/
    ├── Integration/
    │   └── SearchEndpointTests.cs       # Integration tests for /api/search (partial match, recursive, sorting, pagination, traversal)
    └── Services/
        └── FileBrowserSearchTests.cs    # Unit tests for traversal logic, edge cases, and path security

frontend/
├── src/
│   ├── api.ts                           # Add SearchItem, SearchResponse interfaces and searchFiles client function
│   └── views/
│       └── file-explorer-view.ts        # Search input, mode transition, upload button visibility, folder click, pagination, spinner
└── tests/
    ├── api.test.ts                      # Unit tests for searchFiles API client function
    └── views/
        └── file-explorer-search.test.ts # View tests for search box placement, upload button hiding, spinner, folder drilldown, pagination
```

**Structure Decision**:
Follows the established full-stack architecture. Backend adds `SearchRequest`, `SearchResponseDto`, `SearchResultItemDto`, and implements `SearchFilesAsync` in `FileBrowserService` exposed via `FileBrowserController`. Frontend adds `searchFiles` in `api.ts` and enhances `FileExplorerView` to manage browsing vs searching modes, the operation loading spinner, dynamic upload button visibility, and `1 .. N` pagination.

## Complexity Tracking

*No violations. All design elements adhere strictly to project constitution principles.*
