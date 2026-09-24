# Data Model & Entity Specifications: File & Directory Browsing Web API

## Core Entities

### 1. `BrowseRequest` (Input Query Model)
Represents client query parameters submitted to `GET /api/browse`.

- **Attributes**:
  - `path`: `string?` (optional, default: `""`) — Relative directory path to browse. Omitted or empty indicates the home root.
  - `page`: `int` (optional, default: `1`) — 1-based page number. Must be >= 1.
  - `pageSize`: `int` (optional, default: `50`) — Maximum items per page. Allowed range: 1 to 100.

- **Validation Rules**:
  - `path` must not resolve outside the home directory (path traversal check).
  - If `page < 1`, defaults to `1`.
  - If `pageSize < 1`, defaults to `50`. If `pageSize > 100`, clamped to `100`.

---

### 2. `FileSystemItemDto`
Represents an individual file or directory item within a browse response.

- **Attributes**:
  - `name`: `string` (required) — File or folder name (e.g., `"document.pdf"`, `"subfolder"`).
  - `size`: `string` (required) — File size in bytes for files (e.g., `"1048576"`), or `"-"` for folders.
  - `type`: `string` (required) — Item classification: `"folder"` for directories, `"file"` for files.

- **Validation Invariants**:
  - For any item where `type == "folder"`, `size` MUST strictly be `"-"`.
  - For any item where `type == "file"`, `size` MUST be the non-negative byte count formatted as a string.

---

### 3. `BrowseResponse` (Output Model)
Represents the paginated JSON payload returned by `GET /api/browse`.

- **Attributes**:
  - `currentPath`: `string` — Normalized relative path of the directory being viewed (`""` represents root).
  - `page`: `int` — Current 1-based page number.
  - `pageSize`: `int` — Items per page limit.
  - `totalCount`: `int` — Total items found in the target directory across all pages.
  - `totalPages`: `int` — Computed total number of pages (`ceil(totalCount / pageSize)`).
  - `items`: `List<FileSystemItemDto>` — Paginated list of file and folder items for the current page.

---

### 4. `HomeDirectoryOptions` (Server Configuration)
Configuration model injected into the storage and browsing services.

- **Attributes**:
  - `RootPath`: `string` — Resolved absolute directory path for the home root storage directory.
  - Defaults to `./storage` relative to the application base directory if `FILE_BROWSER_ROOT` environment variable is not defined.

---

## State Transitions & Processing Lifecycles

### Server Startup Lifecycle

```
[Server Starts]
      │
      ▼
[Read FILE_BROWSER_ROOT environment variable]
      │
      ▼
[Resolve Absolute Path (or default to ./storage)]
      │
      ▼
[Directory Exists Check] ──No──► [Attempt Directory.CreateDirectory]
      │                                     │
      │                                 (Fails) ──► [Throw Fatal InvalidOperationException]
      │                                     │ (Success)
      ▼                                     ▼
[Execute Read/Write Probe (.probe_{guid}.tmp)]
      │
      ├── (Cannot create/write/delete file) ──► [Throw Fatal InvalidOperationException & Abort]
      │
      └── (Success: Probe created, read, deleted)
            │
            ▼
      [Bind Web API Pipeline & Run Application]
```

### Browse Request Processing Lifecycle

```
[GET /api/browse?path=...&page=1&pageSize=50]
      │
      ▼
[Resolve Target Path against Root]
      │
      ├── (Path escapes Root) ────────────────► [Return 400 Bad Request (Traversal Blocked)]
      │
      ├── (Target Directory Does Not Exist) ──► [Return 404 Not Found]
      │
      ├── (Target Path is a File, not Folder) ─► [Return 400 Bad Request]
      │
      └── (Target Directory Exists)
            │
            ▼
      [Enumerate Entries: Folders first, then Alphabetical]
            │
            ▼
      [Apply Pagination: Skip((page-1)*pageSize).Take(pageSize)]
            │
            ▼
      [Map to FileSystemItemDto: Folders get "-", Files get size string]
            │
            ▼
      [Return 200 OK with BrowseResponse JSON]
```

### Download Request Processing Lifecycle

```
[GET /api/download?path=...]
      │
      ▼
[Resolve Target Path against Root]
      │
      ├── (Path escapes Root) ──────────► [Return 400 Bad Request (Traversal Blocked)]
      │
      ├── (Target File Does Not Exist) ──► [Return 404 Not Found]
      │
      ├── (Target Path is a Directory) ──► [Return 400 Bad Request ("Cannot download a directory")]
      │
      └── (Valid File Target)
            │
            ▼
      [Resolve MIME Content-Type & Return PhysicalFileResult Stream]
```
