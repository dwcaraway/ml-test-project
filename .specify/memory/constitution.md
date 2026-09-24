<!--
### Sync Impact Report
- Version change: Initial scaffold -> 1.0.0
- Modified principles:
  - [PRINCIPLE_1_NAME] -> I. Zero-Framework Vanilla TypeScript SPA
  - [PRINCIPLE_2_NAME] -> II. Strict Client-Side Rendering & JSON Web API Boundary
  - [PRINCIPLE_3_NAME] -> III. Architectural Boundaries & Workspace Segregation
  - [PRINCIPLE_4_NAME] -> IV. Simplicity, Readability & Function Over Styling (KISS)
  - [PRINCIPLE_5_NAME] -> V. High Performance Standards
- Added principles:
  - VI. Mandatory Automated Testing & Tooling Compliance
- Added sections:
  - Technology Stack & Build Requirements
  - Development Workflow & Quality Gates
- Removed sections:
  - None
- Follow-up TODOs:
  - None
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

### VI. Mandatory Automated Testing & Tooling Compliance
Automated testing and SDK tooling compliance are non-negotiable:
- Frontend code MUST include unit and component-level tests run via Vitest, accompanied by strict TypeScript type checking (`tsc`).
- Backend code MUST include unit and integration tests run via xUnit and `Microsoft.AspNetCore.Mvc.Testing`.
- The entire solution MUST build, run, and test cleanly using standard command-line SDK tools (`dotnet`, `npm`) and VS Code without reliance on proprietary IDE features.
*Rationale*: Guarantees regressions are caught early, contracts remain verified, and any developer can build and test from standard environments.

## Technology Stack & Build Requirements

The project adheres to the following foundational technology specifications:
- **Backend**: .NET 8 (C#) using ASP.NET Core Web API.
- **Frontend**: Vanilla TypeScript built and served with Vite.
- **Data Exchange**: JSON payloads over HTTP.
- **Build & Development Tooling**: Standard .NET 8 SDK CLI (`dotnet build`, `dotnet test`, `dotnet run`) and Node.js/npm CLI (`npm run dev`, `npm run build`, `npm test`, `npm run typecheck`), fully compatible with VS Code.
- **Configuration & Security**: Secrets and environment-specific settings MUST use environment variables or local gitignored configurations; no credentials or secrets may ever be committed.

## Development Workflow & Quality Gates

All development activities MUST pass through structured quality gates before integration:
1. **Contract Synchronization**: Any API or schema change MUST update both backend endpoint models and frontend client contracts in the same change set.
2. **Quality Gates**:
   - Backend validation: `dotnet build` and `dotnet test` MUST pass with zero warnings/errors.
   - Frontend validation: `npm run typecheck`, `npm test`, and `npm run build` MUST pass cleanly.
3. **Scope Discipline**: Changes MUST be strictly scoped to their respective application areas (`backend/` or `frontend/`). Unrelated cleanups or refactorings MUST NOT be bundled with functional changes.

## Governance

This constitution represents the foundational policy of the project and supersedes all informal development practices.
- **Compliance**: All pull requests, code modifications, and AI-assisted workflows MUST verify compliance with every principle defined herein before merging.
- **Amendments**: Amendments require documented rationale, an evaluation of impact across existing frontend and backend implementations, and formal approval.
- **Versioning Policy**: This document follows Semantic Versioning (MAJOR.MINOR.PATCH):
  - MAJOR: Removal or fundamental modification of an established core principle (e.g., introducing a frontend framework or server-side rendering).
  - MINOR: Addition of a new principle, section, or material expansion of architectural requirements.
  - PATCH: Clarifications, typographical fixes, and non-semantic refinements.
- **Runtime Guidance**: Operational development guidelines, scripts, and local developer commands are documented in [AGENTS.md](file:///C:/Users/dwcar/repos/ml-test-project/AGENTS.md).

**Version**: 1.0.0 | **Ratified**: 2026-09-24 | **Last Amended**: 2026-09-24
