# AGENTS.md

## Project Overview
Backend service providing a web api

## Tech Stack
- **Framework:** .NET 8 (LTS)
- **Languages:** C# 12
- **Key Libraries/Patterns:** ASP.NET Core, Entity Framework Core 8, LINQ, Async/Await standard practices.

## Commands
- **Restore:** `dotnet restore`
- **Build:** `dotnet build --no-restore`
- **Test:** `dotnet test --no-build --verbosity normal`
- **Run:** `dotnet run`
- **Lint:** `dotnet format --verify-no-changes`

## Architecture & Project Structure
- **Solution Structure:** Clean Architecture / Vertical Slice (adapt to your layout)
  - `TestProject.Tests/`: Integration and E2E tests
  - `Controllers/`: .NET Core controllers/endpoints, middleware.
- **Conventions:**
  - One primary class/interface per file.
  - Use primary constructors where concise.
  - Always make asynchronous methods async/await-ready with `CancellationToken` support passed down.

## Coding Style & Rules
- **Nullability:** Enable `#nullable enable` across all files; avoid suppressing warnings (`!`) unless absolutely required.
- **Naming:** PascalCase for classes, methods, and public properties; camelCase for local variables and private fields (`_fieldName`).
- **Logging:** Use `ILogger<T>` via dependency injection; never use raw `Console.WriteLine`.
- **Exception Handling:** Use typed custom exceptions for domain errors; handle global exceptions via ASP.NET Core middleware.

## Testing Instructions
- Unit tests go into `TestProject.Tests/` using (xUnit, Moq/NSubstitute, FluentAssertions).
- Integration tests go into `TestProject.Tests/Integration` using `WebApplicationFactory`.
- Every bug fix or new feature must include a corresponding unit or integration test.
- Coverage: 90%

## Boundaries

**Always do:**
- Include unit tests for new functions
- Run lint before committing
- Use environment variables for configuration

**Ask first:**
- Database schema changes
- Adding new dependencies
- Modifying CI/CD pipelines
- Changes to authentication or authorization logic

**Never do:**
- Commit secrets, API keys, or connection strings
- Edit generated migration files
- Push directly to master branch