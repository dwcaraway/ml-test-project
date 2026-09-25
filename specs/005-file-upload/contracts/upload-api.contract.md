# Interface Contracts: File Upload Web API & Client

## 1. Backend REST API Specification

### Endpoint: `POST /api/upload`

Uploads a single file into the specified directory within the storage boundary.

#### Request
- **HTTP Method**: `POST`
- **Route**: `/api/upload`
- **Content-Type**: `multipart/form-data`
- **Query Parameters**:
  - `path` (`string`, *optional*, default: `""`): Target destination folder relative to the storage root.
- **Form Data**:
  - `file` (`IFormFile`, *required*): The binary file payload.

#### Responses

##### `200 OK`
Returned when the file is successfully saved to disk.
```json
{
  "fileName": "document_copy1.pdf",
  "path": "docs",
  "sizeBytes": 1048576,
  "message": "File uploaded successfully."
}
```

##### `400 Bad Request`
Returned when validation fails:
1. **File missing or empty**:
   ```json
   {
     "error": "A file must be provided for upload."
   }
   ```
2. **File size exceeds 8 MB**:
   ```json
   {
     "error": "File exceeds the maximum allowed size of 8 MB."
   }
   ```
3. **Path traversal or invalid path**:
   ```json
   {
     "error": "Invalid path or path traversal detected."
   }
   ```

##### `404 Not Found`
Returned when the target directory does not exist:
```json
{
  "error": "Destination directory not found."
}
```

##### `500 Internal Server Error`
Returned on unexpected I/O or system failure:
```json
{
  "error": "An error occurred while uploading the file."
}
```

---

## 2. Frontend Client API Function

### `uploadFile`

Located in `frontend/src/api.ts`.

```typescript
export interface UploadResponse {
  fileName: string;
  path: string;
  sizeBytes: number;
  message: string;
}

export async function uploadFile(
  path: string,
  file: File,
  baseUrl: string = ''
): Promise<UploadResponse>;
```

#### Behavior
- Validates `file.size <= 8 * 1024 * 1024` client-side. If violated, throws `Error("File exceeds the maximum allowed size of 8 MB.")`.
- Appends `file` to a `FormData` instance.
- Issues `POST ${baseUrl}/api/upload?path=${encodeURIComponent(path)}`.
- If response is not OK, parses `{ error: string }` from JSON response and throws `new Error(errorMessage)`.
- Returns parsed `UploadResponse` on success.

---

## 3. DOM & UI Contracts

### 3.1 Explorer Header with Upload Action

In `frontend/src/views/file-explorer-view.ts`:

```html
<header class="explorer-header">
  <h2>Files</h2>
  <div class="header-actions">
    <button type="button" class="upload-btn" id="upload-file-button" aria-label="Upload File">
      Upload
    </button>
  </div>
  <input type="file" class="file-upload-input" style="display: none;" aria-hidden="true" />
</header>
```

### 3.2 File Counts Footer

In `frontend/src/views/file-explorer-view.ts`:

```html
<div class="file-counts-footer" id="item-counts-summary" aria-live="polite">
  Folders: 2 | Files: 4
</div>
```
When an upload completes, `Files:` count immediately updates without full page refresh.
