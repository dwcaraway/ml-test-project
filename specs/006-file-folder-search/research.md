# Research & Technical Decisions: Recursive File and Folder Search with Pagination

**Feature**: Recursive File and Folder Search with Pagination  
**Feature Directory**: `specs/006-file-folder-search`  

---

## 1. Search Web API Protocol & Endpoint Design

### Decision
Expose a RESTful JSON endpoint via `GET /api/search`:
- **Route**: `GET /api/search`
- **Query Parameters**:
  - `path` (`string`, *optional*, default `""`): Relative directory path within storage root where recursive search begins.
  - `query` (`string`, *required*): The substring to search for against file and folder names.
  - `page` (`int`, *optional*, default `1`): 1-based page number (clamped to `>= 1`).
  - `pageSize` (`int`, *optional*, default `50`): Maximum items per page (clamped between `1` and `100`).

### Rationale
- `GET` is the standard HTTP method for search queries because search operations are idempotent, safe, non-destructive, and can be bookmarked or cached.
- Aligns directly with the existing `GET /api/browse` parameter conventions (`path`, `page`, `pageSize`) established in feature 002.
- Returning JSON satisfies Constitution Principle II (Strict Client-Side Rendering & JSON Web API Boundary).

### Alternatives Considered
- `POST /api/search` with JSON body: Violates REST semantics for read-only queries and disables HTTP caching and standard URL sharing. Rejected.
- Embedding query in path segment (`/api/search/{query}`): Difficult to encode nested directory paths, slashes, and complex search characters cleanly in URL path segments. Query parameters are standard and robust. Rejected.

---

## 2. Recursive Filesystem Traversal & Pattern Matching

### Decision
1. **Base Path Validation**: Validate `path` using existing `ResolveAndValidatePath(basePath, mustBeDirectory: true)` to guarantee the search starts strictly inside the canonical storage root and throws `SecurityException` (`400 Bad Request`) on traversal attempts (`../`, `..\`, absolute paths).
2. **Recursive Traversal**:
   - Recursively enumerate all directories and files under the validated canonical directory.
   - Use `Directory.EnumerateDirectories` and `Directory.EnumerateFiles` (or `Directory.EnumerateFileSystemEntries`) with `SearchOption.AllDirectories`, or manual recursion if permission-resilient traversal is required.
   - Wrap traversal in error handling to skip any unreadable directories (`UnauthorizedAccessException`, `DirectoryNotFoundException`) gracefully without failing the entire search.
3. **Matching Logic**:
   - Evaluate `Path.GetFileName(entryPath)`: Check `fileName.Contains(query, StringComparison.OrdinalIgnoreCase)`.
   - Match **only** against the item name. Do NOT inspect file contents or metadata.
   - Both folders and files that match are collected.
4. **Relative Path Resolution**:
   - Compute relative path for each matching item from the storage root (e.g. `docs/reports/summary.txt` or `photos/vacation`) so the client can download files or navigate into folders.

### Rationale
- Case-insensitive ordinal comparison ensures intuitive search behavior across Windows, Linux, and macOS platforms.
- Isolating name comparison prevents high CPU/disk overhead associated with content scanning.
- Robust exception handling prevents a single restricted subdirectory from breaking the entire search.

### Alternatives Considered
- Regular expression matching from user input: Exposes the server to ReDoS (Regular Expression Denial of Service) and unexpected syntax errors. Substring matching is faster, safer, and directly matches the user requirement ("partial name match"). Rejected.
- Windows Indexing Service / Lucene: Adds external dependencies, complex index synchronization, and violates Constitution Principle IV (Simplicity, KISS). Filesystem enumeration is lightweight and direct. Rejected.

---

## 3. Sorting by Type and Pagination

### Decision
1. **Sort Hierarchy**:
   - All matching items are partitioned/sorted by type first: **Folders first**, then **Files**.
   - Within each type group, items are sorted alphabetically by name (`StringComparer.OrdinalIgnoreCase`).
2. **Deterministic Pagination**:
   - Slicing `(page - 1) * pageSize` taking `pageSize` is executed **after** sorting the entire matched collection.
   - Returns metadata: `page`, `pageSize`, `totalCount` (total matches across all subtrees), and `totalPages` (`Math.Ceiling((double)totalCount / pageSize)`). If `totalCount == 0`, `totalPages = 1` and `items = []`.

### Rationale
- Sorting folders first mirrors the standard behavior of `GET /api/browse`, keeping user expectations and UI rendering consistent.
- Sorting before pagination guarantees reproducible page slices without item duplication or skipping across pages.

---

## 4. UI Layout & State Management (Browse Mode vs Search Mode)

### Decision
`FileExplorerView` manages two view states: `browsing` and `searching`.

1. **Browse Mode**:
   - Header layout: Title ("Files"), then action bar containing the **Search Box** (input + search button) immediately to the left of the **Upload** button.
   - Breadcrumb navigation reflects the current directory path.
   - Table displays items in the current folder.
   - Footer displays item counts summary (`Folders: X | Files: Y`).

2. **Search Mode**:
   - Triggered when the user submits a non-empty query in the search box.
   - Header layout: The **Upload** button is hidden (`display: none` / omitted).
   - The **Search Box** is displayed prominently above the search results table, with an indicator of the active search (e.g. "Search results for '{query}' in {currentPath}").
   - A "Clear Search" / "Back to Browsing" action allows the user to exit search mode and return to standard browsing.
   - Table displays matching items with their name, type icon/label, and size (`"-"` for folders, byte count for files).
   - Folder click behavior: Clicking any folder in the search results sets `currentPath` to that folder's relative path, switches mode back to `browsing`, loads the contents of that folder, and restores the upload button.
   - File click behavior: Clicking a file triggers download via `/api/download?path={item.path}`.
   - Pagination bar: Renders at the bottom of the table with numbered options `1 .. N`, highlighting the current active page. Clicking a page number triggers search for that specific page.

### Rationale
- Conforms directly to the user requirement: "Do not display the upload button on the UI while performing search as we don't know where the user wishes to upload to. In the UI, the search box should be above the search results. When in browsing mode, display the search box to the left of the upload link."
- Folder selection returning to browse mode provides intuitive drill-down navigation.

---

## 5. Global Operation Loading Spinner

### Decision
Implement a centralized loading spinner indicator within `FileExplorerView` that activates during any of the three asynchronous operations:
- **Search**: `isSearching`
- **Delete**: `isDeleting`
- **Upload**: `isUploading`

1. **DOM Element**: An accessible spinner element (`#explorer-spinner` with `role="status"` and `aria-label="Loading"`) rendered in the explorer header/action bar.
2. **State Control**:
   ```typescript
   private setOperationState(operation: 'search' | 'delete' | 'upload' | null): void
   ```
   - If `operation !== null`: Show spinner (remove hidden class, set `aria-hidden="false"`), optionally disable action buttons to prevent conflicting concurrent clicks.
   - If `operation === null`: Hide spinner (add hidden class, set `aria-hidden="true"`).
3. **Execution Guard**: All asynchronous handlers (`handleSearch`, `handleDelete`, `handleUpload`) wrap API invocations in `try ... finally { this.setOperationState(null); }` to guarantee the spinner is always hidden when the network/disk operation completes, even if an error is thrown.
4. **CSS Animation**: Minimal lightweight CSS spinner using pure CSS `@keyframes spin` with standard border/border-top styling (Zero frameworks, Principle I & IV).

### Rationale
- Satisfies requirement: "While searching, deleting or uploading but before we receive a response, display a spinning icon so the user doesn't think the search failed. Hide this spinning icon when not searching, deleting or uploading."
- Centralizing operation state prevents visual race conditions when multiple operations could be queued or handled.
