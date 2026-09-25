# AGENTS.md

## Project Overview
This repository contains a full-stack application split into frontend and backend concerns:
- `frontend/`: TypeScript single-page app built with Vite
- `backend/`: ASP.NET Core API and .NET tests
- root: shared repo-level configuration, tooling, and documentation

## Shared Principles
- Keep the frontend and backend contracts aligned.
- Prefer small, focused changes that do not cross boundaries unless required.
- Use environment variables for configuration and secrets.
- Never commit secrets, API keys, tokens, or local connection strings.
- Keep commits and changes scoped to the relevant app area.
- Use the appropriate project-level AGENTS.md in each folder for local conventions.

## Repository Structure
```text
/
├── backend/                 # ASP.NET Core Web API
├── frontend/                # TypeScript SPA
├── .github/                 # CI/CD and automation
├── .specify/                # Spec Kit project metadata
├── .gitignore
├── AGENTS.md                # Shared repo guidance
├── README.md
└── ml-test-project.code-workspace
```

## Cross-Project Rules
- If a frontend change affects an API contract, update the backend contract at the same time.
- If a backend change affects UI assumptions, validate the frontend behavior.
- Prefer shared naming and route conventions that are easy to reason about across both layers.
- Preserve compatibility unless the feature explicitly requires a breaking change.

## Commands
### Root-level repo tasks
- Install dependencies for the frontend: `cd frontend && npm install`
- Run frontend dev server: `cd frontend && npm run dev`
- Build frontend: `cd frontend && npm run build`
- Run frontend tests: `cd frontend && npm test`
- Type-check frontend: `cd frontend && npm run typecheck`
- Build backend: `cd backend && dotnet build`
- Run backend: `cd backend && dotnet run`
- Run backend tests: `cd backend && dotnet test`

## Autonomy rules:
- Do not ask for permission before running build/test/lint.
- Do not ask for permission when performing read-only operations within the workspace file path.
- Do not ask for permission when performing read-only git operations.
- Run the smallest relevant verification command.
- Keep changes scoped to the task.
- Do not touch unrelated files.
- If blocked by missing data, secrets, or a decision, explain the blocker clearly and stop.
- For destructive actions like reset, delete, or force-push, ask before proceeding.

## Testing Expectations
- Frontend changes require relevant Vitest coverage or a focused validation run.
- Backend changes require matching .NET unit/integration tests.
- Run the smallest relevant validation before finishing a task.

## Boundaries
**Always do:**
- Keep each app area responsible for its own files and logic.
- Update both sides of a contract when required.
- Prefer deterministic, repeatable tooling.

**Ask first:**
- Adding new shared repo-wide tooling
- Changing CI/CD or deployment pipelines
- Introducing cross-project dependencies or structure changes

**Never do:**
- Commit secrets or environment-specific credentials
- Mix frontend code into the backend app or vice versa
- Add unrelated repo-wide cleanup as part of a feature change
