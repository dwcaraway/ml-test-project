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
│   │   ├── components/             # Reusable UI components (Navbar, HeroCard, Breadcrumb, FileList)
│   │   ├── views/                  # Composite views (HomeView, DetailView, NotFoundView, FileExplorerView)
│   │   ├── api.ts                  # API client logic (fetchApiMessage, fetchBrowseDirectory)
│   │   └── main.ts                 # App initialization & route registration
│   ├── tests/                      # Frontend unit & component tests (Vitest)
│   ├── index.html                  # HTML entry point
│   ├── package.json                # Frontend dependencies & npm scripts
│   ├── tsconfig.json               # TypeScript configuration
│   └── vite.config.ts              # Vite server & proxy configuration
├── specs/                          # Spec Kit feature specifications, plans, and tasks
│   ├── 001-spa-views-routing/      # SPA Views & Deep-Linking Routing specification
│   ├── 002-file-browser-api/       # File & Directory Browsing and Download Web API specification
│   ├── 003-file-explorer-view/     # Frontend File Explorer View & Breadcrumb Navigation specification
│   ├── 004-item-deletion-and-counts/ # File Explorer Item Counts and Secure Deletion specification
│   └── 005-file-upload/            # File Upload with Conflict Renaming and Size Limits specification
├── storage/                        # Server-side home root directory for file browsing & download (sample data)
├── seed-storage.ps1                # Generates a local storage tree for API testing
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

## Local Storage Seed Data for Testing

The project includes a root-level PowerShell helper, `seed-storage.ps1`, that creates a realistic local storage tree under the repository's `storage/` folder for browser and download testing.

Run it from the project root:

```powershell
./seed-storage.ps1
```

This script will:

* remove and recreate the `storage/` directory so the tree is deterministic
* create between 25 and 100 files at the root level
* create between 5 and 10 folders at the root level
* recurse through child folders and generate additional files/folders up to 5 levels deep
* create a mix of nested directories and sample text files for the file browser API to browse

This is useful when you want to exercise paging, nested directory traversal, sorting, and download behavior without manually creating test data.

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

##### 3. Delete File or Directory (`DELETE /api/delete`)

Permanently deletes a file or directory located within the configured storage root directory.

* **Query Parameters:**
  * `path` (*required*): Relative path to the file or directory to delete.

* **Response (`200 OK`):**
  ```json
  {
    "message": "Item deleted successfully."
  }
  ```

* **Error Responses:**
  * `400 Bad Request`: Missing/empty path, path traversal attempt (`../`, `..\\`), or attempt to delete the storage root directory.
  * `404 Not Found`: File or directory does not exist.

> [!NOTE]
> Deleting a folder recursively deletes all nested files and subdirectories within that folder. Attempts to delete the root storage directory itself are strictly prohibited.

##### 4. Upload File (`POST /api/upload`)

Uploads a file via `multipart/form-data` to the designated directory path within the configured storage root.

* **Query Parameters:**
  * `path` (*optional*, default: `""`): Target directory path within the storage root where the file will be uploaded.

* **Request Body:**
  * `multipart/form-data` containing the file payload with form field name `file` (maximum allowed size: 8 MB / 8,388,608 bytes).

* **Non-Destructive Conflict Resolution:**
  * Existing files are **never overwritten**. If a file with the same name already exists in the destination folder, the server automatically appends a numeric suffix before the file extension (`_copy1`, or `_copy2` if `_copy1` exists, etc.).

* **Response (`200 OK`):**
  ```json
  {
    "fileName": "sample_copy1.txt",
    "path": "docs",
    "sizeBytes": 1024,
    "message": "File uploaded successfully."
  }
  ```

* **Error Responses:**
  * `400 Bad Request`: Missing file payload, file size strictly exceeds the 8 MB limit, or path traversal attempt (`../`, `..\\`).
  * `404 Not Found`: Target destination directory does not exist.

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
   > The Vite development server is configured in `vite.config.ts` to automatically proxy requests made to `/test` and `/api` to the backend at `https://localhost:7146`. Make sure the backend server is running concurrently if you want to test API interaction.

---

### File Explorer View & Breadcrumb Navigation (`/files`)

The frontend includes a responsive, zero-framework File Explorer view accessible via the global **Files** navigation link or directly at [`http://localhost:3000/files`](http://localhost:3000/files):

* **Directory Browsing**: Dynamically queries the backend API (`GET /api/browse?path=...`) and displays files and folders in a semantic table.
* **Schema-Compliant Size Formatting**: Folders strictly render `"-"` in the size column, while files display their byte size.
* **Direct File Streaming Downloads**: Files feature a direct download link targeting `GET /api/download?path={filePath}`, utilizing native browser download capabilities without memory buffering. Folders omit download links.
* **Item Counts Summary Footer**: Prominently displays the total count of folders and non-folder files on the current directory results at the bottom of the table (`Folders: X | Files: Y`), automatically recalculating when items are removed or added.
* **Safe Item Deletion with Confirmation**: Both files and folders provide an accessible **Delete** action in the Actions column. Clicking Delete presents a browser confirmation prompt (`window.confirm`) identifying the item name and explicitly warning that the action is permanent and unrecoverable. Upon confirmation, the deletion request is dispatched to `DELETE /api/delete`, removing the item from the view and decrementing counters immediately without requiring a full page refresh.
* **Native File Upload with Conflict Handling**: An **Upload** button is placed above and to the right of the File Explorer view. Selecting it opens the native OS file picker to upload files directly into the active viewing directory. File size is enforced up to 8 MB with immediate client-side and server-side validation. Existing files are protected from accidental overwrite through automatic numeric copy postfixing (`_copy1`, `_copy2`, etc.), immediately updating the item list and incrementing the footer file counter.
* **Dynamic Breadcrumb Navigation**:
  * Hidden when viewing the root storage directory.
  * When viewing subdirectories, displays a hierarchical path starting with `Home` (`Home > docs`).
  * When directory depth exceeds 3 levels below root (e.g. `level1/level2/level3/level4`), collapses intermediate levels: `Home > ... > level4`.
  * The `...` button expands the hidden path segments inline on click without reloading.
  * Clicking any ancestor segment navigates directly to that folder.
* **Deep-Linking & History Synchronization**: The current folder is preserved in the URL query string (`/files?path=docs/reports`), integrating with browser `pushState`/`popstate` so Back and Forward buttons work seamlessly.

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
