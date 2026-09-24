# Implementation Plan: File & Directory Browsing Web API

**Branch**: `002-file-browser-api` | **Date**: 2026-09-24 | **Spec**: [specs/002-file-browser-api/spec.md](file:///C:/Users/dwcar/repos/ml-test-project/specs/002-file-browser-api/spec.md)

**Input**: Feature specification from `specs/002-file-browser-api/spec.md`

## Summary

Implement a secure, high-performance ASP.NET Core Web API for directory browsing and file downloading. The root storage directory is resolved via the `FILE_BROWSER_ROOT` environment variable with fallback to `./storage`. The server validates read and write permissions on startup via an active probe, terminating initialization immediately (fail-fast) if inaccessible. Directory browsing (`GET /api/browse?path=...`) provides pagination, path traversal defense, and schema-compliant outputs (`name`, and `size` with folders returning `"-"`). File download (`GET /api/download?path=...`) streams files efficiently via `PhysicalFileResult`.

## Technical Context

**Language/Version**: C# 12 / .NET 8.0 (Backend)

**Primary Dependencies**: ASP.NET Core 8.0 Web API, `Microsoft.AspNetCore.StaticFiles` (for dynamic MIME type detection)

**Storage**: Local or mounted network file system rooted at the path configured via `FILE_BROWSER_ROOT` (or `./storage`)

**Testing**: xUnit, `Microsoft.AspNetCore.Mvc.Testing` (`WebApplicationFactory`) for unit and integration testing

**Target Platform**: Cross-platform server (.NET 8 runtime on Windows, Linux, macOS)

**Project Type**: Web API backend service

**Performance Goals**: < 200ms browse response for directories with up to 10k items when paginated, asynchronous streaming downloads without in-memory buffering, < 500ms startup verification

**Constraints**: Pure JSON Web API for browsing, binary stream for downloads, strict path traversal blocking (100% of traversal attempts outside root blocked), fail-fast startup on permission failure, zero authentication at this stage

**Scale/Scope**: Handles arbitrarily deep directory trees and multi-gigabyte file downloads safely

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Zero-Framework Vanilla TypeScript SPA)**: **PASS**. Backend API implementation; no frontend frameworks or libraries introduced.
- **Principle II (Strict Client-Side Rendering & JSON Web API Boundary)**: **PASS**. All browse endpoints strictly return JSON payloads; downloads stream raw binary data. Zero server-side HTML rendering.
- **Principle III (Architectural Boundaries & Workspace Segregation)**: **PASS**. All implementation changes and tests are located strictly within `backend/` and `backend/TestProject.Tests/`.
- **Principle IV (Simplicity, Readability & Function Over Styling - KISS)**: **PASS**. Minimalist controller-service architecture without redundant database layers or over-engineered abstractions.
- **Principle V (High Performance Standards)**: **PASS**. Uses lazy `DirectoryInfo.EnumerateFileSystemInfos` and non-buffering `PhysicalFileResult` streaming to preserve memory.
- **Principle VI (Mandatory Automated Testing, Linting & Tooling Compliance)**: **PASS**. Full xUnit unit and integration test coverage for path traversal, size formatting, pagination, and download streaming. Clean `dotnet build` and `dotnet test`.
- **Principle VII (Clarification Over Assumption)**: **PASS**. Environment variable naming (`FILE_BROWSER_ROOT`), fail-fast startup policy, and query parameter path navigation (`?path=...`) were explicitly clarified and confirmed with the user.
- **Principle VIII (Documentation Currency)**: **PASS**. API contracts and quickstart validation guide generated; `README.md` will be kept current.

## Project Structure

### Documentation (this feature)

```text
specs/002-file-browser-api/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── file-browser-api.contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── Controllers/
│   └── FileBrowserController.cs      # Endpoints for GET /api/browse and GET /api/download
├── Services/
│   ├── IFileBrowserService.cs         # Service contract for directory browsing and file resolution
│   ├── FileBrowserService.cs          # Path traversal checks, pagination, enumeration, and streaming
│   └── FileBrowserStartupValidator.cs # Probe-based read/write startup verification
├── Models/
│   ├── BrowseRequest.cs               # Query parameter model (path, page, pageSize)
│   ├── BrowseResponse.cs              # Output pagination model
│   └── FileSystemItemDto.cs           # Name, size ('-' for folders), type
├── Configuration/
│   └── FileBrowserOptions.cs          # Strongly-typed configuration for storage root path
├── Program.cs                         # Service registrations and startup probe execution
└── TestProject.Tests/
    ├── Controllers/
    │   └── FileBrowserControllerTests.cs # Controller unit tests
    ├── Services/
    │   └── FileBrowserServiceTests.cs    # Unit tests for traversal protection and pagination
    └── Integration/
        ├── FileBrowserIntegrationTests.cs # Full HTTP integration tests for browse and download
        └── StartupValidationTests.cs     # Tests for startup fail-fast behavior
```

**Structure Decision**:
Maintains the existing ASP.NET Core project structure under `backend/`. Extends `Controllers/`, `Services/`, and `Models/` to encapsulate storage access cleanly without adding external third-party dependencies.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations. All design elements adhere strictly to project constitution principles.*
