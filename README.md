# ML Test Project

[![Project Tests](https://github.com/dwcaraway/ml-test-project/actions/workflows/tests.yml/badge.svg)](https://github.com/dwcaraway/ml-test-project/actions/workflows/tests.yml)

A full-stack web application starter featuring a C# ASP.NET Core backend and a TypeScript single-page application (SPA) frontend built with Vite.

---

## Project Structure

```text
ml-test-project/
├── backend/                        # ASP.NET Core Web API & test solution
│   ├── Controllers/                # ASP.NET Core web API controllers
│   ├── Properties/                 # Launch profiles (launchSettings.json)
│   ├── TestProject.Tests/          # xUnit unit & integration tests
│   │   ├── Controllers/            # Unit tests for controller behavior
│   │   └── Integration/            # Integration tests (API endpoints, SPA fallback)
│   ├── wwwroot/                    # Built frontend distribution target / static files (tracked via .gitkeep)
│   ├── Program.cs                  # ASP.NET Core host, pipeline, and SPA fallback routing
│   ├── appsettings*.json           # Runtime configuration files
│   ├── TestProject.csproj          # Main .NET project file
│   └── TestProject.sln             # Solution file
├── frontend/                       # TypeScript SPA built with Vite
│   ├── src/                        # TypeScript source files
│   │   ├── core/                   # Core SPA router, view, and component base classes
│   │   ├── components/             # Reusable UI components (Navbar, HeroCard)
│   │   ├── views/                  # Composite views (HomeView, DetailView, NotFoundView)
│   │   ├── api.ts                  # API client logic
│   │   └── main.ts                 # App initialization & route registration
│   ├── tests/                      # Frontend unit & component tests (Vitest)
│   ├── index.html                  # HTML entry point
│   ├── package.json                # Frontend dependencies & npm scripts
│   ├── tsconfig.json               # TypeScript configuration
│   └── vite.config.ts              # Vite server & proxy configuration
├── specs/                          # Spec Kit feature specifications, plans, and tasks
│   └── 001-spa-views-routing/      # SPA Views & Deep-Linking Routing specification
├── .github/workflows/              # CI/CD automation workflows
├── .specify/                       # Spec Kit project metadata & constitution
├── AGENTS.md                       # Repo guidance and conventions
└── README.md
```

---

## Prerequisites

* [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (or compatible newer SDK such as .NET 9)
* [Node.js](https://nodejs.org/) (v18+ or current LTS recommended) and npm

Verify your installation:

```bash
dotnet --version
node --version
```

---

## Backend Server

The backend is built with ASP.NET Core and provides the Web API service as well as hosting for the static production frontend build.

### Running the Server

1. **Navigate to the backend directory:**

   ```bash
   cd backend
   ```

2. **Restore dependencies & build:**

   ```bash
   dotnet build
   ```

3. **Run the application:**

   ```bash
   dotnet run
   ```

4. **Access the application:**

   By default, the server listens on the following endpoints (defined in `backend/Properties/launchSettings.json`):

   * **HTTPS:** `https://localhost:7146`
   * **HTTP:** `http://localhost:5120`

   Key routes:
   * **API Endpoint:** [`https://localhost:7146/test`](https://localhost:7146/test) &mdash; returns `"API Response"`
   * **Frontend Entry:** [`https://localhost:7146/index.html`](https://localhost:7146/index.html) &mdash; serves static files or built SPA assets from `backend/wwwroot`

---

### Running Server Tests

The test suite uses **xUnit** and **Microsoft.AspNetCore.Mvc.Testing** for unit and integration testing.

* **Run all backend tests:**

  ```bash
  cd backend
  dotnet test
  ```

---

## Frontend Server

The frontend application is a modern single-page application built with TypeScript and Vite.

### Running the Development Server

1. **Navigate to the frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Access the application:**

   Open your browser at [`http://localhost:3000`](http://localhost:3000).

   > [!NOTE]
   > The Vite development server is configured in `vite.config.ts` to automatically proxy requests made to `/test` to the backend at `https://localhost:7146`. Make sure the backend server is running concurrently if you want to test API interaction.

---

### Building for Production

* **Build the application:**

  ```bash
  npm run build
  ```

  This runs TypeScript verification (`tsc`) and compiles static assets via Vite directly into `backend/wwwroot` so the ASP.NET Core server can host the SPA.

  > [!WARNING]
  > Running `npm run build` will overwrite and delete the `backend/wwwroot/.gitkeep` file (due to Vite's `emptyOutDir: true`). Because `.gitignore` ignores all build outputs in `backend/wwwroot/` while explicitly whitelisting `!backend/wwwroot/.gitkeep`, losing `.gitkeep` causes the `wwwroot` folder to no longer be tracked or stored by git.
  >
  > If you run `npm run build` locally, always restore `.gitkeep` before committing:
  > ```bash
  > git checkout backend/wwwroot/.gitkeep
  > ```

* **Preview the production build:**

  ```bash
  npm run preview
  ```

---

### Running Frontend Tests & Type Checking

* **Run unit tests (Vitest):**

  ```bash
  npm test
  ```

* **Run TypeScript type checking:**

  ```bash
  npm run typecheck
  ```

---

## Continuous Integration

A GitHub Actions workflow is configured at [`.github/workflows/tests.yml`](.github/workflows/tests.yml) and runs automatically on every push and pull request targeting the `main` branch (as well as via manual `workflow_dispatch` triggers).

The CI pipeline executes two parallel jobs:

* **Backend .NET Tests (`backend-tests`)**:
  * Sets up the .NET 8.0 SDK.
  * Restores dependencies and builds `backend/TestProject.sln` in `Release` mode.
  * Verifies `backend/wwwroot/.gitkeep` exists, failing with an actionable error message if missing (e.g., if overwritten by `npm run build`).
  * Runs all unit and integration tests via `dotnet test`.

* **Frontend npm Tests (`frontend-tests`)**:
  * Sets up Node.js 20 with npm dependency caching.
  * Installs dependencies cleanly via `npm ci`.
  * Runs all unit and component tests with Vitest (`npm test`).
  * Enforces static typing via TypeScript type checking (`npm run typecheck`).
