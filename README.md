# ML Test Project

[![Project Tests](https://github.com/dwcaraway/ml-test-project/actions/workflows/tests.yml/badge.svg)](https://github.com/dwcaraway/ml-test-project/actions/workflows/tests.yml)

A full-stack web application starter featuring a C# ASP.NET Core backend and a TypeScript single-page application (SPA) frontend built with Vite.

---

## Project Structure

```text
ml-test-project/
├── backend/                        # ASP.NET Core Web API & test solution
│   ├── Configuration/              # Strongly-typed configuration options (FileBrowserOptions)
│   ├── Controllers/                # ASP.NET Core web API controllers (FileBrowserController, TestController)
│   ├── Models/                     # DTOs and request/response models (BrowseRequest, BrowseResponse, FileSystemItemDto)
│   ├── Properties/                 # Launch profiles (launchSettings.json)
│   ├── Services/                   # Business services & validators (FileBrowserService, FileBrowserStartupValidator)
│   ├── TestProject.Tests/          # xUnit unit & integration tests
│   │   ├── Controllers/            # Unit tests for controller behavior
│   │   ├── Integration/            # Integration tests (Browse, Download, Startup probe, SPA fallback)
│   │   └── Services/               # Unit tests for path resolution and traversal protection
│   ├── wwwroot/                    # Built frontend distribution target / static files (tracked via .gitkeep)
│   ├── Program.cs                  # ASP.NET Core host, pipeline, startup validation, and SPA fallback routing
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
│   ├── 001-spa-views-routing/      # SPA Views & Deep-Linking Routing specification
│   └── 002-file-browser-api/       # File & Directory Browsing and Download Web API specification
├── storage/                        # Server-side home root directory for file browsing & download (sample data)
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
   * **Test API Endpoint:** [`https://localhost:7146/test`](https://localhost:7146/test) &mdash; returns `"API Response"`
   * **File Browser API:** [`https://localhost:7146/api/browse`](https://localhost:7146/api/browse) &mdash; paginated directory listings
   * **File Download API:** [`https://localhost:7146/api/download?path={path}`](https://localhost:7146/api/download) &mdash; streaming file downloads
   * **Frontend Entry:** [`https://localhost:7146/index.html`](https://localhost:7146/index.html) &mdash; serves static files or built SPA assets from `backend/wwwroot`

---

### File & Directory Browsing Web API

The backend includes a secure, high-performance file and directory browsing API with streaming file download capabilities.

#### Configuration (`FILE_BROWSER_ROOT`)

The home root directory for browsing and downloading files can be configured via environment variable:

| Environment Variable | Default Fallback | Description |
|----------------------|------------------|-------------|
| `FILE_BROWSER_ROOT`  | `./storage`      | Absolute or relative path to the server-side root directory. |

#### Startup Read/Write Verification (Fail-Fast)

On startup, before accepting any network traffic or binding to HTTP ports, the backend verifies read and write access to the configured storage root by executing an active probe (`.probe_{guid}.tmp`). If the directory cannot be accessed, created, written to, or read from, the server immediately halts process initialization with a fatal `InvalidOperationException`.

#### API Endpoints

##### 1. Browse Directory (`GET /api/browse`)

Returns a paginated JSON listing of files and folders within the specified directory.

* **Query Parameters:**
  * `path` (*optional*, default: `""`): Relative directory path within the home directory.
  * `page` (*optional*, default: `1`): 1-based page number (clamped to `>= 1`).
  * `pageSize` (*optional*, default: `50`): Maximum items per page (clamped between `1` and `100`).

* **Response (`200 OK`):**
  ```json
  {
    "currentPath": "docs",
    "page": 1,
    "pageSize": 50,
    "totalCount": 2,
    "totalPages": 1,
    "items": [
      {
        "name": "sample-folder",
        "size": "-",
        "type": "folder"
      },
      {
        "name": "readme.txt",
        "size": "45",
        "type": "file"
      }
    ]
  }
  ```
  > [!NOTE]
  > Folders strictly return `size: "-"`, while files report their non-negative byte count formatted as a string.

* **Error Responses:**
  * `400 Bad Request`: Returned when path traversal is attempted (`../`, `..\\`) or the path targets a file instead of a directory.
  * `404 Not Found`: Returned when the requested directory does not exist.

##### 2. Download File (`GET /api/download`)

Streams a file from the server using `PhysicalFileResult` without buffering into memory.

* **Query Parameters:**
  * `path` (*required*): Relative path to the file to download.

* **Response (`200 OK`):**
  * Binary stream with `Content-Disposition: attachment; filename="{filename}"`
  * Dynamic MIME type resolved via `FileExtensionContentTypeProvider`
  * HTTP range processing enabled for resumable downloads

* **Error Responses:**
  * `400 Bad Request`: Missing/empty path, path traversal attempt, or path targets a directory instead of a file.
  * `404 Not Found`: File does not exist.

#### Security & Path Traversal Prevention

All incoming paths are canonicalized and strictly verified against the storage root directory. Any attempt to navigate outside the home directory via `../`, `..\\`, absolute paths, or prefix collision attempts is blocked with `400 Bad Request`.

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
