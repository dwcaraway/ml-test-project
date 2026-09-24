<!--
### Sync Impact Report
- Version change: 1.1.0 -> 1.2.0
- Modified principles: None
- Added principles:
  - VIII. Documentation Currency (Keep README.md Up to Date)
- Added sections: None
- Modified sections:
  - Development Workflow & Quality Gates (added documentation synchronization gate)
- Removed sections: None
- Follow-up TODOs: None
-->

# ML Test Project Constitution

## Core Principles

### I. Zero-Framework Vanilla TypeScript SPA
The frontend MUST be built purely in vanilla TypeScript without external frontend frameworks (e.g., React, Angular, Vue, Svelte) and without third-party UI component libraries. All DOM elements, interactions, and views MUST be created and managed client-side using native browser web APIs and standard TypeScript.
*Rationale*: Eliminates runtime bloat, eliminates framework deprecation churn, and maximizes rendering efficiency while retaining direct control over memory and the DOM.

### II. Strict Client-Side Rendering & JSON Web API Boundary
All HTML markup MUST be rendered client-side in the browser. The server MUST NOT render HTML or server-side view templates (e.g., Razor, MVC, Blazor). The server MUST exclusively provide a RESTful JSON Web API for all data interactions. Frontend and backend data contracts MUST remain explicitly synchronized.
*Rationale*: Establishes a clean architectural decoupling between presentation and business logic, simplifying independent development, verification, and API consumption.

### III. Architectural Boundaries & Workspace Segregation
Code responsibilities MUST adhere strictly to repository folder boundaries:
- `backend/`: ASP.NET Core Web API, controllers, services, and .NET test projects.
- `frontend/`: TypeScript SPA source code, Vite build configuration, and Vitest test suites.
- Root: Shared repository-level configuration, tooling, and documentation.
Frontend code MUST NOT be mixed into backend projects, and backend logic MUST NOT leak into the client SPA. Shared contracts or types across boundaries must be kept in deliberate alignment.
*Rationale*: Prevents spaghetti coupling, preserves clean modularity, and ensures predictable project navigation.

### IV. Simplicity, Readability & Function Over Styling (KISS)
Simple design MUST always be favored over complicated architecture. Code readability, functional correctness, and maintainability take strict precedence over elaborate styling, complex animations, or speculative abstractions. Keep CSS minimal and focused on functional layout and usability.
*Rationale*: Core file and directory browsing workflows prioritize speed, clarity, and reliability over aesthetic embellishment.

### V. High Performance Standards
Client and server performance is highly valued across all operations. The backend server MUST utilize non-blocking asynchronous I/O and efficient file system enumeration. The frontend client MUST maintain a lightweight footprint, avoiding unnecessary DOM re-renders and memory leaks during large directory traversals.
*Rationale*: File and directory hierarchies can scale to thousands of items; efficient I/O and lightweight rendering guarantee a responsive user experience.

### VI. Mandatory Automated Testing, Linting & Tooling Compliance
Automated testing, linting compliance, and standard SDK tooling are non-negotiable across all project code:
- Both frontend and backend code MUST always pass linting, formatting, and static analysis without warnings or errors.
- Frontend code MUST include unit and component-level tests run via Vitest, accompanied by strict TypeScript type checking (`tsc`) and linter checks with zero errors or warnings.
- Backend code MUST include unit and integration tests run via xUnit and `Microsoft.AspNetCore.Mvc.Testing`, alongside .NET code analysis and formatting checks with zero warnings or errors.
- The entire solution MUST build, lint, run, and test cleanly using standard command-line SDK tools (`dotnet`, `npm`) and VS Code without reliance on proprietary IDE features.
*Rationale*: Guarantees regressions are caught early, code cleanliness and consistent conventions are preserved, contracts remain verified, and any developer can build and test from standard environments.

### VII. Clarification Over Assumption (Ask When Unsure)
Whenever requirements, system contracts, architecture, or expected behaviors are ambiguous, underspecified, or uncertain, the AI agent (and developers) MUST explicitly ask the user for clarification before making assumptions or proceeding with implementation. Guessing or silently proceeding with arbitrary defaults is strictly forbidden.
*Rationale*: Prevents architectural drift, misaligned API contracts, rework, and unneeded complexity caused by proceeding on unverified assumptions.

### VIII. Documentation Currency (Keep README.md Up to Date)
Project documentation—specifically [README.md](file:///C:/Users/dwcar/repos/ml-test-project/README.md)—MUST be maintained as a live, accurate reflection of the current codebase. Whenever application architecture, project directory layout, API contracts, prerequisites, development commands, or routing behavior change, [README.md](file:///C:/Users/dwcar/repos/ml-test-project/README.md) MUST be updated synchronously within the same change set. Documentation MUST never lag behind implementation.
*Rationale*: Stale documentation confuses contributors, breaks onboarding, and causes agent misalignment. Maintaining live documentation guarantees immediate transparency and operational readiness.

## Technology Stack & Build Requirements

The project adheres to the following foundational technology specifications:
- **Backend**: .NET 8 (C#) using ASP.NET Core Web API with Roslyn analyzers and code formatting enforcement.
- **Frontend**: Vanilla TypeScript built and served with Vite, enforced via TypeScript compiler checks and linting.
- **Data Exchange**: JSON payloads over HTTP.
- **Build & Development Tooling**: Standard .NET 8 SDK CLI (`dotnet build`, `dotnet test`, `dotnet run`) and Node.js/npm CLI (`npm run dev`, `npm run build`, `npm test`, `npm run typecheck`), fully compatible with VS Code.
- **Configuration & Security**: Secrets and environment-specific settings MUST use environment variables or local gitignored configurations; no credentials or secrets may ever be committed.

## Development Workflow & Quality Gates

All development activities MUST pass through structured quality gates before integration:
1. **Contract Synchronization**: Any API or schema change MUST update both backend endpoint models and frontend client contracts in the same change set.
2. **Quality Gates**:
   - Backend validation: `dotnet build`, analyzer/lint checks, and `dotnet test` MUST pass with zero warnings/errors.
   - Frontend validation: `npm run typecheck`, linter verification, `npm test`, and `npm run build` MUST pass cleanly.
3. **Scope Discipline**: Changes MUST be strictly scoped to their respective application areas (`backend/` or `frontend/`). Unrelated cleanups or refactorings MUST NOT be bundled with functional changes.
4. **Ambiguity Resolution**: If any requirement or constraint is unclear at any stage of the workflow, execution MUST pause to seek clarification.
5. **Documentation Synchronization**: Any structural, operational, or feature modification MUST review and update [README.md](file:///C:/Users/dwcar/repos/ml-test-project/README.md) to keep project guidance, command references, and architecture maps current.

## Governance

This constitution represents the foundational policy of the project and supersedes all informal development practices.
- **Compliance**: All pull requests, code modifications, and AI-assisted workflows MUST verify compliance with every principle defined herein before merging.
- **Ambiguity Rule**: When encountering ambiguity or uncertainty regarding implementation details, requirements, or design trade-offs, agents and contributors MUST ask for clarification rather than inferring or assuming.
- **Amendments**: Amendments require documented rationale, an evaluation of impact across existing frontend and backend implementations, and formal approval.
- **Versioning Policy**: This document follows Semantic Versioning (MAJOR.MINOR.PATCH):
  - MAJOR: Removal or fundamental modification of an established core principle (e.g., introducing a frontend framework or server-side rendering).
  - MINOR: Addition of a new principle, section, or material expansion of architectural requirements.
  - PATCH: Clarifications, typographical fixes, and non-semantic refinements.
- **Runtime Guidance**: Operational development guidelines, scripts, and local developer commands are documented in [AGENTS.md](file:///C:/Users/dwcar/repos/ml-test-project/AGENTS.md).

**Version**: 1.2.0 | **Ratified**: 2026-09-24 | **Last Amended**: 2026-09-24
