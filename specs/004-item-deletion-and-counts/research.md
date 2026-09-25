# Technical Research: File Explorer Item Counts and Secure Deletion

## Architectural Decisions & Patterns

### 1. Backend Deletion API (`DELETE /api/delete`)
- **Context**: The user requested an `/api/delete` endpoint in the backend Web API that takes a path parameter, attempts to delete the item (file or folder), enforces strict storage root boundary checks (no deleting outside browser root), and returns error codes on failure.
- **Decision**: 
  - Expose `[HttpDelete("delete")]` in `FileBrowserController` taking `[FromQuery] string? path`.
  - Add `DeleteItem(string? relativePath)` to `IFileBrowserService` and `FileBrowserService`.
  - Canonicalize the path against `_storageRoot` using existing boundary checks.
  - Specifically block attempts to delete the root directory itself (`relativePath` is empty, `"/"`, or points to `_storageRoot`).
  - Distinguish files vs directories:
    - If `File.Exists(fullPath)`: Call `File.Delete(fullPath)`.
    - If `Directory.Exists(fullPath)`: Call `Directory.Delete(fullPath, recursive: true)` to support deleting folders containing contents.
    - If neither exists: Throw `FileNotFoundException` (or `DirectoryNotFoundException`) mapped to `404 Not Found`.
  - Error mappings:
    - Path traversal (`..`, invalid characters): `400 Bad Request` (`{ "error": "Invalid path or path traversal detected." }`).
    - Root deletion attempt: `400 Bad Request` (`{ "error": "Cannot delete the storage root directory." }`).
    - Target not found: `404 Not Found` (`{ "error": "Item not found." }`).
    - Permission or I/O failure: `500 Internal Server Error` (or `400 Bad Request` depending on exception type).
  - Success response: `200 OK` with JSON `{ "message": "Item deleted successfully." }`.
- **Rationale**:
  - Consistent with `/api/browse` and `/api/download` patterns.
  - Using HTTP `DELETE` verb matches standard RESTful conventions.
  - Recursive directory deletion ensures folders with nested files can be cleanly deleted from the UI without orphaned children blocking the deletion.
- **Alternatives Considered**:
  - *HTTP POST `/api/delete`*: Less idiomatic for RESTful deletion operations; `DELETE` is standard and natively supported.
  - *Non-recursive directory deletion*: Would fail if a folder contains any files, forcing the user to manually enter and delete every child file first, violating user expectations for a file manager.

---

### 2. Frontend Item Counting & Footer Display
- **Context**: The File Explorer must count the number of folders and the number of files (excluding folders) in current directory results and display this at the bottom of the view.
- **Decision**:
  - Implement a counter calculation over the currently displayed `items: FileSystemItem[]`:
    - `folderCount = items.filter(i => i.type === 'folder').length;`
    - `fileCount = items.filter(i => i.type === 'file').length;`
  - Render an accessible summary element below the file table:
    `<div class="file-counts-footer" id="item-counts-summary" aria-live="polite">Folders: {folderCount} | Files: {fileCount}</div>`
  - When an item is deleted, remove it from `items` and recompute the counts instantly in memory.
- **Rationale**:
  - Strictly client-side calculation (Constitution Principle II).
  - O(N) over current page results (max 100 items), executing in < 1ms without requiring additional server round-trips.
  - Using `aria-live="polite"` ensures screen readers announce updated counts.
- **Alternatives Considered**:
  - *Server-provided item counts in `BrowseResponse`*: Backend API `BrowseResponse` already returns `totalCount`, but does not separate folder count vs file count. Calculating on the client over current page items fulfills the requirement without breaking existing backend API response contracts.

---

### 3. Deletion Confirmation Prompt & Accidental Deletion Protection
- **Context**: The feature requires prompting the user to confirm deletion and explicitly warning that the action is not recoverable.
- **Decision**:
  - Use native `window.confirm(`Are you sure you want to delete "${itemName}"? This action is not recoverable.`)` prior to invoking the deletion API client.
  - If the user clicks Cancel, the handler exits immediately with zero side-effects.
  - If the user clicks OK, the frontend calls `deleteItem(itemPath)`.
- **Rationale**:
  - Adheres strictly to Zero-Framework Vanilla TypeScript (Constitution Principle I) and KISS (Principle IV).
  - Native `window.confirm` is modal, blocks interaction synchronously, cannot be accidentally clicked through, and requires zero extra UI markup or focus-trapping libraries.
- **Alternatives Considered**:
  - *Custom DOM modal dialog*: Adds DOM complexity, focus management overhead, keyboard trapping requirements, and styling bloat without functional advantage over native dialog for this confirmation workflow.

---

### 4. Delete Action Placement & Table Actions Column Integration
- **Context**: The frontend needs a delete link to the right of files and folders in the table.
- **Decision**:
  - In `FileListComponent`, update the `Actions` column:
    - For folders: `<a href="#" class="delete-link" data-name="{name}">Delete</a>`
    - For files: `<a href="/api/download?path={filePath}" class="download-link" download="{name}">Download</a> <a href="#" class="delete-link" data-name="{name}">Delete</a>`
  - Pass an `onItemDelete: (item: FileSystemItem) => Promise<void>` callback to `FileListComponent`.
  - Prevent default link navigation on click and trigger the confirmation flow.
- **Rationale**:
  - Places download and delete actions neatly side-by-side in the existing Actions column.
  - Keeps `FileListComponent` responsible for DOM rendering while delegating delete execution and state management to `FileExplorerView`.
