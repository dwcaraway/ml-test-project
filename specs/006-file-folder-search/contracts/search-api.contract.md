# Interface Contracts: Recursive File and Folder Search Web API & Client

## 1. Backend REST API Specification

### Endpoint: `GET /api/search`

Recursively searches files and folders matching a partial name substring, beginning at the specified path and traversing all descendant subdirectories.

#### Request
- **HTTP Method**: `GET`
- **Route**: `/api/search`
- **Query Parameters**:
  - `path` (`string`, *optional*, default: `""`): Relative directory path within storage root where search begins.
  - `query` (`string`, *required*): The search term to match against file and folder names.
  - `page` (`int`, *optional*, default: `1`): 1-based page index. Clamped to `>= 1`.
  - `pageSize` (`int`, *optional*, default: `50`): Number of items per page. Clamped between `1` and `100`.

#### Responses

##### `200 OK`
Returned when the search executes successfully.
```json
{
  "basePath": "docs",
  "query": "annual",
  "page": 1,
  "pageSize": 50,
  "totalCount": 2,
  "totalPages": 1,
  "items": [
    {
      "name": "annual-reports",
      "path": "docs/annual-reports",
      "size": "-",
      "type": "folder"
    },
    {
      "name": "annual-budget.xlsx",
      "path": "docs/annual-reports/annual-budget.xlsx",
      "size": "45056",
      "type": "file"
    }
  ]
}
```

##### `400 Bad Request`
Returned when validation fails:
1. **Empty Query**:
   ```json
   {
     "error": "Search query cannot be empty."
   }
   ```
2. **Path Traversal Attempt**:
   ```json
   {
     "error": "Invalid path or path traversal detected."
   }
   ```

##### `404 Not Found`
Returned when the base starting directory does not exist:
```json
{
  "error": "Directory not found."
}
```

---

## 2. Frontend Client API Function

### `searchFiles`

Located in `frontend/src/api.ts`.

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

export async function searchFiles(
  path: string,
  query: string,
  page: number = 1,
  pageSize: number = 50,
  baseUrl: string = ''
): Promise<SearchResponse>;
```

#### Behavior
- Validates `query.trim().length > 0`. If empty, rejects or returns empty result without network call.
- Dispatches `GET ${baseUrl}/api/search?path=${encodeURIComponent(path)}&query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`.
- If response is not OK, parses `{ error: string }` and throws `new Error(error)`.
- Returns parsed `SearchResponse` on HTTP 200.

---

## 3. DOM & UI Contracts

### 3.1 Explorer Header in Browse Mode
In browsing mode, the search input box is placed immediately to the left of the upload link in `.header-actions`:

```html
<header class="explorer-header">
  <h2>Files</h2>
  <div class="header-actions">
    <!-- Spinning icon (hidden when idle) -->
    <span id="explorer-spinner" class="spinner-icon hidden" role="status" aria-label="Loading" aria-hidden="true"></span>

    <!-- Search box to the left of upload -->
    <form class="search-form" id="explorer-search-form" role="search">
      <input
        type="search"
        id="search-input"
        class="search-input"
        placeholder="Search files and folders..."
        aria-label="Search files and folders"
      />
      <button type="submit" id="search-submit-btn" class="search-btn">Search</button>
    </form>

    <!-- Upload button visible in browse mode -->
    <button type="button" class="upload-btn" id="upload-file-button" aria-label="Upload File">
      Upload
    </button>
  </div>
</header>
```

### 3.2 Explorer Header in Search Mode
When in search results mode:
- The Upload button (`#upload-file-button`) is hidden (`style.display = 'none'` or omitted).
- The search form remains visible positioned above the search results table.
- A search header / banner displays the active search query and a "Clear Search" or "Back to Browse" action.

```html
<div class="search-results-banner">
  <span>Search results for: <strong>"{query}"</strong> ({totalCount} items found)</span>
  <button type="button" id="clear-search-btn" class="clear-search-btn">Back to Browsing</button>
</div>
```

### 3.3 Search Results Table & Item Conventions
- Matching folders display item name and `"-"` in the size column. Clicking the folder triggers navigation into that folder's contents in browse mode.
- Matching files display item name and byte count in the size column, with download link `/api/download?path={item.path}`.

### 3.4 Pagination Controls (1 .. N)
Positioned at the bottom of the File Explorer view:

```html
<nav class="pagination-nav" id="search-pagination" aria-label="Search results pagination">
  <span class="pagination-info">Page 1 of 3</span>
  <div class="pagination-pages">
    <button type="button" class="page-btn active" data-page="1" aria-current="page">1</button>
    <button type="button" class="page-btn" data-page="2">2</button>
    <button type="button" class="page-btn" data-page="3">3</button>
  </div>
</nav>
```
- Active page has `.active` class and `aria-current="page"`.
- Clicking a page button loads that page's results and updates the active selection.

### 3.5 Global Spinner Indicator
Rendered inside `.header-actions`:
- CSS `@keyframes spin { to { transform: rotate(360deg); } }`.
- Active whenever `isSearching`, `isDeleting`, or `isUploading` is true.
- Hidden (`display: none` / `.hidden`) when idle.
