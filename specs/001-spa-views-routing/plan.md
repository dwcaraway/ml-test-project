# Implementation Plan: SPA Views & Deep-Linking Routing

**Branch**: `001-spa-views-routing` | **Date**: 2026-09-24 | **Spec**: [specs/001-spa-views-routing/spec.md](file:///C:/Users/dwcar/repos/ml-test-project/specs/001-spa-views-routing/spec.md)

**Input**: Feature specification from `specs/001-spa-views-routing/spec.md`

## Summary

Implement a lightweight, zero-dependency client-side router and modular view architecture in vanilla TypeScript for a Single-Page Application (SPA). The router utilizes the native browser HTML5 History API (`pushState`, `replaceState`, `popstate`) for path-based deep linking (e.g., `/`, `/detail/:id`) and synchronized browser history navigation (Back/Forward). Views are structured as orchestration containers that manage collections of reusable UI components with deterministic mount/unmount lifecycles and leak-free event cleanup. ASP.NET Core is updated with SPA fallback routing (`app.MapFallbackToFile("index.html")`) to support direct deep-linking on production builds.

## Technical Context

**Language/Version**: TypeScript 5.4+ (Frontend), C# / .NET 8 (Backend)

**Primary Dependencies**: Vanilla TypeScript (native DOM and History APIs), Vite 8.3+, Vitest 5.0+, Happy-DOM (for test environment), ASP.NET Core 8.0 (backend host)

**Storage**: In-memory view state + URL path/parameter serialization via HTML5 History API; no database or browser storage required for router core

**Testing**: Vitest with Happy-DOM for frontend unit and component tests; xUnit with `Microsoft.AspNetCore.Mvc.Testing` for backend integration tests

**Target Platform**: Modern evergreen web browsers (ES2022+) and ASP.NET Core .NET 8 runtime

**Project Type**: Full-stack web application (Vanilla TypeScript SPA frontend + ASP.NET Core Web API backend)

**Performance Goals**: < 50ms view transition latency, zero full-page reloads, < 10KB total uncompressed router/view core footprint, 60fps UI updates

**Constraints**: Zero frontend frameworks (no React, Angular, Vue), zero third-party UI component libraries, pure client-side HTML rendering, strict TypeScript type checking (`tsc --noEmit`), 100% linting pass with zero warnings or errors

**Scale/Scope**: Extensible modular routing and view lifecycle architecture supporting arbitrary views and component trees; initial demonstration harness includes Home View, Detail View, and NotFound View

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Zero-Framework Vanilla TypeScript SPA)**: **PASS**. Entire routing engine, views, and components are written in pure TypeScript using native browser DOM APIs. No external framework or component library is used.
- **Principle II (Strict Client-Side Rendering & JSON Web API Boundary)**: **PASS**. All HTML markup is created and rendered client-side. The server only serves static files and JSON APIs.
- **Principle III (Architectural Boundaries & Workspace Segregation)**: **PASS**. Client routing and views are isolated in `frontend/src/`. Server fallback configuration is isolated in `backend/Program.cs`. No cross-boundary leakage.
- **Principle IV (Simplicity, Readability & Function Over Styling - KISS)**: **PASS**. Simple interface-based architecture (`IView`, `IComponent`, `Router`) avoiding complex virtual DOM, AST compilation, or reactive proxy machinery.
- **Principle V (High Performance Standards)**: **PASS**. Direct DOM operations, fast regex route matching, and `AbortController` cleanup ensure zero memory leaks and sub-50ms transitions.
- **Principle VI (Mandatory Automated Testing, Linting & Tooling Compliance)**: **PASS**. Full test coverage across Vitest and xUnit, strict TypeScript typechecking, and lint compliance. Builds with standard `npm` and `dotnet` CLI tools.
- **Principle VII (Clarification Over Assumption)**: **PASS**. Key decisions (History API, initial view harness scope, path/resource state granularity) were clarified and confirmed during the specify phase.

## Project Structure

### Documentation (this feature)

```text
specs/001-spa-views-routing/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── router.contract.ts
│   └── spa-fallback.contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── Program.cs                        # Configured with MapFallbackToFile("index.html")
└── TestProject.Tests/
    └── Integration/
        └── SpaFallbackTests.cs       # Integration test validating SPA fallback routing

frontend/
├── src/
│   ├── core/                         # Core SPA routing & view infrastructure
│   │   ├── router.ts                 # HTML5 History API Router implementation
│   │   ├── view.ts                   # Base View contract / class
│   │   └── component.ts              # Base Component contract / utilities
│   ├── components/                   # Reusable UI components
│   │   ├── navbar.ts                 # Navigation bar component with active link detection
│   │   └── hero-card.ts              # Content / information card component
│   ├── views/                        # Page-level views composing components
│   │   ├── home-view.ts              # Default home view
│   │   ├── detail-view.ts            # Param-driven detail view (/detail/:id)
│   │   └── not-found-view.ts         # 404 fallback view
│   ├── main.ts                       # App bootstrap, route registration, router start
│   └── index.html                    # Root SPA entry template with #app container
└── tests/
    ├── router.test.ts                # Unit tests for routing and param extraction
    ├── view.test.ts                  # Tests for view lifecycle and component unmounting
    └── components.test.ts            # Component rendering tests
```

**Structure Decision**:
Maintains the existing repository layout (`frontend/` and `backend/`). The frontend codebase introduces clean `core/`, `components/`, and `views/` directories to provide structural modularity without introducing external runtime dependencies.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations. All design elements adhere strictly to project constitution principles.*
