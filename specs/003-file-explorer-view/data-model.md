# Data Model & Component Specifications: Frontend File Explorer View

## 1. Core Data Models

### `FileSystemItem`
Represents an individual entry returned by the browse API.
- **Attributes**:
  - `name`: `string` &mdash; Name of the file or folder (e.g. `"readme.txt"`, `"docs"`).
  - `size`: `string` &mdash; Byte length as a string for files (e.g. `"1048576"`), or `"-"` for folders.
  - `type`: `'folder' | 'file'` &mdash; Item classification.

### `BrowseResponse`
Represents the paginated API response payload from `GET /api/browse`.
- **Attributes**:
  - `currentPath`: `string` &mdash; Normalized relative path of the directory (`""` indicates root).
  - `page`: `number` &mdash; Current 1-based page index.
  - `pageSize`: `number` &mdash; Maximum items per page.
  - `totalCount`: `number` &mdash; Total items in directory.
  - `totalPages`: `number` &mdash; Computed total pages.
  - `items`: `FileSystemItem[]` &mdash; List of items for current page.

---

## 2. Component Models & UI State

### `BreadcrumbSegment`
Represents an individual clickable node within the breadcrumb navigation trail.
- **Attributes**:
  - `name`: `string` &mdash; Text displayed on the breadcrumb segment (e.g., `"Home"`, `"docs"`, `"..."`).
  - `path`: `string` &mdash; Relative directory path targeting this segment (`""` for Home/root).
  - `isClickable`: `boolean` &mdash; `true` for ancestor folders; `false` for current directory or non-clickable ellipsis.
  - `isCurrent`: `boolean` &mdash; `true` if this segment represents the actively viewed folder.

### `FileExplorerViewState`
State managed by `FileExplorerView` during its lifecycle.
- **Attributes**:
  - `currentPath`: `string` &mdash; Currently active relative directory path (parsed from `?path=...`).
  - `items`: `FileSystemItem[]` &mdash; Current directory entries.
  - `status`: `'idle' | 'loading' | 'success' | 'empty' | 'error'` &mdash; Active view rendering state.
  - `errorMessage`: `string | null` &mdash; Friendly error message when status is `'error'`.
  - `isBreadcrumbExpanded`: `boolean` &mdash; `true` if the user clicked `...` to expand hidden intermediate breadcrumb levels.

---

## 3. State Machines & Transitions

### A. View Data Fetching Lifecycle

```
[Route Change: /files?path=...]
       │
       ▼
 [status = 'loading'] ──► Render Loading Spinner
       │
       ▼
 [Call fetchBrowseDirectory(path)]
       │
       ├── (Success & items.length > 0) ──► [status = 'success'] ──► Render Table & Breadcrumbs
       │
       ├── (Success & items.length == 0) ─► [status = 'empty'] ────► Render Empty State & Breadcrumbs
       │
       └── (API Error / Network Failure) ─► [status = 'error'] ────► Render Error Banner + Retry Button
```

### B. Breadcrumb Collapsing State Machine

```
Path depth = path.split('/').filter(Boolean).length

 [Depth <= 3] ──────────────────────► Display Full Trail: Home > Seg1 > Seg2 > Seg3
       │
 [Depth > 3]
       │
       ├── [isBreadcrumbExpanded == false] ──► Display Collapsed: Home > ... > Current
       │                                                                  │
       │                                                        (User clicks '...')
       │                                                                  │
       │                                                                  ▼
       └── [isBreadcrumbExpanded == true]  ◄─────────── Sets isBreadcrumbExpanded = true
                                                                          │
                                                                          ▼
                                                              Display Full Trail: Home > Seg1 > Seg2 > ... > Current
```

### C. Directory Navigation Flow

```
[User clicks Folder Row in Table]
       │
       ▼
Compute Target Path: currentPath ? `${currentPath}/${folderName}` : folderName
       │
       ▼
router.navigate(`/files?path=${encodeURIComponent(targetPath)}`)
       │
       ▼
[URL Updates in Browser History] ──► [View Unmounts/Remounts or Refetches] ──► Render New Directory
```
