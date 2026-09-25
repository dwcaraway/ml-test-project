# Data Model & State Specifications: Item Counts & Deletion

## 1. Core Data Models

### `DeleteRequest` (Backend & API Client)
Represents the request parameters sent to `DELETE /api/delete`.
- **Attributes**:
  - `path`: `string` &mdash; Relative path of the file or directory to delete within the storage root directory.

### `DeleteResponse` (Backend & API Client)
Represents the JSON payload returned upon successful deletion.
- **Attributes**:
  - `message`: `string` &mdash; Confirmation message (e.g., `"Item deleted successfully."`).

### `ItemCountSummary` (Frontend Component Model)
Represents the computed count summary displayed in the File Explorer view footer.
- **Attributes**:
  - `folderCount`: `number` &mdash; Total count of items with `type === 'folder'` in the current view.
  - `fileCount`: `number` &mdash; Total count of items with `type === 'file'` in the current view.

---

## 2. Component State & Event Handlers

### `FileExplorerViewState`
State maintained within `FileExplorerView` during directory browsing and deletion workflows.
- **Attributes**:
  - `currentPath`: `string` &mdash; Active directory path relative to storage root (`""` for root).
  - `items`: `FileSystemItem[]` &mdash; Currently displayed file and folder entries.
  - `status`: `'idle' | 'loading' | 'success' | 'empty' | 'error'` &mdash; Active lifecycle state.
  - `errorMessage`: `string | null` &mdash; Error message when `status === 'error'` or when a deletion fails.

### `FileListComponent` Contracts
Constructor signature extended to support item deletion:
```typescript
constructor(
  items: FileSystemItem[],
  currentPath: string,
  onFolderClick: (folderPath: string) => void,
  onDeleteClick?: (item: FileSystemItem) => void
);
```

---

## 3. State Machines & Workflow Transitions

### A. Deletion User Interaction Workflow

```
[User clicks "Delete" link on a row]
       │
       ▼
[Display Confirmation Prompt: window.confirm(...)]
       │
       ├── (User clicks Cancel) ───────► [No Action / Abort: Item remains in list]
       │
       └── (User clicks OK) ───────────► [Call deleteItem(itemPath)]
                                                │
                                                ├── (API Success 200 OK) ──► 1. Remove item from items array
                                                │                            2. Recompute folder & file counts
                                                │                            3. If items.length == 0, render empty state
                                                │                            4. Re-render table and counter footer
                                                │
                                                └── (API Failure 4xx/5xx) ─► Display error banner / notification;
                                                                             keep item in table and counters
```

### B. Dynamic Count Recomputation Workflow

```
[Directory Items Loaded / Changed]
       │
       ▼
Compute folderCount = items.filter(i => i.type === 'folder').length
Compute fileCount   = items.filter(i => i.type === 'file').length
       │
       ▼
Update Counter Footer Text:
"Folders: {folderCount} | Files: {fileCount}"
```
