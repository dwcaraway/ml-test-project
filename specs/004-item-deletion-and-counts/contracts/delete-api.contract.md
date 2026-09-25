# Interface Contracts: Item Deletion API & Frontend Counter

## 1. Backend REST API Specification

### Endpoint: `DELETE /api/delete`

Deletes a file or directory located within the configured storage root directory.

#### Request
- **HTTP Method**: `DELETE`
- **Route**: `/api/delete`
- **Query Parameters**:
  - `path` (`string`, *required*): The relative path of the file or directory to delete within the storage root.

#### Responses

##### `200 OK`
Returned when the file or directory is successfully deleted.
```json
{
  "message": "Item deleted successfully."
}
```

##### `400 Bad Request`
Returned if the path is missing, targets the root directory itself, contains directory traversal sequences (`..`), or is invalid.
```json
{
  "error": "Invalid path or path traversal detected."
}
```
Or when attempting to delete the root directory:
```json
{
  "error": "Cannot delete the storage root directory."
}
```

##### `404 Not Found`
Returned when the requested file or directory does not exist.
```json
{
  "error": "Item not found."
}
```

##### `500 Internal Server Error`
Returned when deletion fails due to an unexpected system or I/O error.
```json
{
  "error": "Failed to delete item."
}
```

---

## 2. Frontend Client API Function

### `deleteItem`

```typescript
export interface DeleteResponse {
  message: string;
}

export async function deleteItem(
  path: string,
  baseUrl: string = ''
): Promise<DeleteResponse>;
```

- **HTTP Request**: `DELETE ${baseUrl}/api/delete?path=${encodeURIComponent(path)}`
- **Behavior**:
  - Sends HTTP DELETE with URL-encoded path.
  - Throws an `Error` containing the server's error message on non-200 responses.
  - Returns the parsed JSON `DeleteResponse` on success.

---

## 3. UI Component DOM Contracts

### Actions Column in `FileListComponent`
Every row in `<tbody>` contains an action cell with a `.delete-link`:

#### File Row
```html
<tr class="file-row">
  <td><span class="file-name">📄 readme.txt</span></td>
  <td class="size-col">45 B</td>
  <td class="action-col">
    <a href="/api/download?path=docs%2Freadme.txt" class="download-link" download="readme.txt">Download</a>
    <a href="#" class="delete-link" role="button" aria-label="Delete readme.txt">Delete</a>
  </td>
</tr>
```

#### Folder Row
```html
<tr class="folder-row">
  <td><a href="/files?path=docs" class="folder-link">📁 docs</a></td>
  <td class="size-col">-</td>
  <td class="action-col">
    <a href="#" class="delete-link" role="button" aria-label="Delete docs">Delete</a>
  </td>
</tr>
```

### Counter Summary Footer in `FileExplorerView`
Appears at the bottom of the File Explorer view below the table:
```html
<div class="file-counts-footer" id="item-counts-summary" aria-live="polite">
  Folders: 2 | Files: 3
</div>
```
When directory is empty:
```html
<div class="file-counts-footer" id="item-counts-summary" aria-live="polite">
  Folders: 0 | Files: 0
</div>
```
