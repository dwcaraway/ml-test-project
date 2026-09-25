# Data Model: Recursive File and Folder Search with Pagination

**Feature**: Recursive File and Folder Search with Pagination  
**Feature Directory**: `specs/006-file-folder-search`  

---

## 1. Entities & Data Transfer Objects

### 1.1 `SearchRequestDto` (Backend Request Model)

Represents query parameters passed to `GET /api/search`.

| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| `path` | `string` | No (default `""`) | Relative path within storage root where recursive search begins. | `"docs"` or `""` (root) |
| `query` | `string` | Yes | Case-insensitive substring to match against file and folder names. | `"report"` |
| `page` | `int` | No (default `1`) | 1-based page index (clamped to `>= 1`). | `1` |
| `pageSize` | `int` | No (default `50`) | Maximum items per page (clamped between `1` and `100`). | `25` |

---

### 1.2 `SearchResultItemDto` (Item Contract)

Represents a single matching file or folder discovered in the recursive search.

| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| `name` | `string` | Yes | Name of the matching file or directory. | `"annual-report.pdf"` |
| `path` | `string` | Yes | Relative path from storage root to this item (used for navigation and downloads). | `"docs/finance/annual-report.pdf"` |
| `size` | `string` | Yes | Display-formatted size string (`"-"` for folders, byte count for files). | `"1048576"` or `"-"` |
| `type` | `string` | Yes | Discriminator indicating item type: `"folder"` or `"file"`. | `"file"` |

---

### 1.3 `SearchResponseDto` (Backend Response Contract)

Represents the paginated search result payload returned by `GET /api/search`.

| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| `basePath` | `string` | Yes | The relative base directory where the search originated. | `"docs"` or `""` |
| `query` | `string` | Yes | The search query string executed. | `"report"` |
| `page` | `int` | Yes | Active 1-based page number. | `1` |
| `pageSize` | `int` | Yes | Number of items per page. | `50` |
| `totalCount` | `int` | Yes | Total number of matching files and folders across all descendant subdirectories. | `73` |
| `totalPages` | `int` | Yes | Total number of pages calculated as `ceil(totalCount / pageSize)` (minimum `1`). | `2` |
| `items` | `List<SearchResultItemDto>` | Yes | Sliced collection of matching items for the current page, sorted by type (folders first). | `[...]` |

#### JSON Representation
```json
{
  "basePath": "docs",
  "query": "report",
  "page": 1,
  "pageSize": 50,
  "totalCount": 3,
  "totalPages": 1,
  "items": [
    {
      "name": "reports-2026",
      "path": "docs/reports-2026",
      "size": "-",
      "type": "folder"
    },
    {
      "name": "annual-report.pdf",
      "path": "docs/reports-2026/annual-report.pdf",
      "size": "204800",
      "type": "file"
    },
    {
      "name": "quarterly-report.xlsx",
      "path": "docs/quarterly-report.xlsx",
      "size": "51200",
      "type": "file"
    }
  ]
}
```

---

### 1.4 Frontend Client Models

Defined in `frontend/src/api.ts` and used in `FileExplorerView`:

```typescript
export interface SearchItem {
  name: string;
  path: string;
  size: string;
  type: 'file' | 'folder';
}

export interface SearchResponse {
  basePath: string;
  query: string;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: SearchItem[];
}

export type ExplorerViewMode = 'browsing' | 'searching';
export type ActiveOperation = 'search' | 'delete' | 'upload' | null;
```

---

## 2. Validation Rules

| Rule ID | Entity / Scope | Constraint | Error Code / Behavior |
|---------|----------------|------------|-----------------------|
| `VAL-SRCH-001` | `path` | Must reside strictly within storage root; no `..`, `..\`, `%2e%2e`, or root escaping | `400 Bad Request` (`"Invalid path or path traversal detected."`) |
| `VAL-SRCH-002` | `path` | Base directory must exist if non-empty | `404 Not Found` (`"Base directory not found."`) |
| `VAL-SRCH-003` | `query` | Substring query must not be null or empty; whitespace-only queries rejected or ignored | `400 Bad Request` (`"Search query cannot be empty."`) |
| `VAL-SRCH-004` | `page` | Clamped to `>= 1` | Default to `1` if omitted or `< 1` |
| `VAL-SRCH-005` | `pageSize` | Clamped between `1` and `100` | Default to `50` if omitted or out of bounds |
| `VAL-SRCH-006` | Traversal | Must only match filenames/foldernames; do not inspect file contents | Omit non-matching items; avoid disk read of contents |

---

## 3. UI State Lifecycle & State Diagram

```
                 ┌────────────────────────────────┐
                 │       Browsing Mode            │
                 │  - Search box left of Upload   │
                 │  - Upload button VISIBLE       │
                 │  - Spinner HIDDEN              │
                 └───────────────┬────────────────┘
                                 │
                     User enters search query
                                 │
                                 ▼
                 ┌────────────────────────────────┐
                 │    Active Search Operation     │
                 │  - Spinner VISIBLE             │
                 │  - API GET /api/search in flight│
                 └───────────────┬────────────────┘
                                 │
                       Response received
                                 │
                                 ▼
                 ┌────────────────────────────────┐
                 │       Search Results Mode      │
                 │  - Search box ABOVE results    │
                 │  - Upload button HIDDEN        │
                 │  - Spinner HIDDEN              │
                 │  - Items: Name, Type, Size     │
                 │  - Pagination (1 .. N) at base │
                 └───────┬───────────────┬────────┘
                         │               │
      User clicks Folder │               │ User clicks "Back to Browse"
      in search results  │               │ or clears search
                         ▼               ▼
                 ┌────────────────────────────────┐
                 │    Browse Folder Contents      │
                 │  - Navigate to selected folder │
                 │  - Mode switches to 'browsing' │
                 │  - Upload button RESTORED      │
                 └────────────────────────────────┘
```
