# Backend HTTP Contract: SPA Fallback Routing

## Purpose
Specifies the HTTP routing contract for the ASP.NET Core backend server to support HTML5 History API deep-linking.

## Route Resolution Rules

When an incoming HTTP GET request arrives at the ASP.NET Core server:

1. **API Endpoints**:
   - Routes starting with `/test` or `/api/*` MUST be handled by ASP.NET Core controllers.
   - Example: `GET /test` -> Returns `200 OK` with `"API Response"`.
   - If an API route does not exist (e.g., `GET /api/nonexistent`), return `404 Not Found` JSON, NOT the SPA `index.html`.

2. **Physical Static Files**:
   - If the request path corresponds to a physical file located in `wwwroot/` (e.g., `/assets/main.js`, `/favicon.ico`, `/robots.txt`), the server MUST serve the static file with appropriate Content-Type and caching headers.

3. **Client-Side SPA Routes (Fallback)**:
   - For any other GET request that does NOT match an API controller or a physical static file, the server MUST return `200 OK` with the contents of `wwwroot/index.html` (Content-Type: `text/html`).
   - Examples:
     - `GET /` -> Serves `index.html`
     - `GET /detail/item-42` -> Serves `index.html`
     - `GET /unknown-path` -> Serves `index.html` (client router displays NotFoundView)

## Implementation Requirement
Configured in `backend/Program.cs` using:
```csharp
app.MapFallbackToFile("index.html");
```

## Integration Test Verification
The backend test suite (`backend/TestProject.Tests/Integration/`) MUST verify:
- `GET /test` returns `200 OK` with text `"API Response"`.
- `GET /detail/item-42` returns `200 OK` with `text/html` when `index.html` exists in `wwwroot`.
