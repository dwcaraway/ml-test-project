# Data Model: File Upload with Conflict Renaming

**Feature**: File Upload with Conflict Renaming and Size Limits  
**Feature Directory**: `specs/005-file-upload`  

---

## 1. Entities & Data Transfer Objects

### 1.1 `UploadResponseDto` (Backend & Frontend Contract)

Represents the result returned by the backend API upon saving an uploaded file.

| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| `fileName` | `string` | Yes | Final name of the file saved on disk (includes `_copyN` suffix if conflict occurred). | `"report_copy1.pdf"` |
| `path` | `string` | Yes | Target directory path where the file was saved. | `"docs/quarterly"` or `""` (root) |
| `sizeBytes` | `number` / `long` | Yes | Exact size of the saved file in bytes. | `2048` |
| `message` | `string` | Yes | Human-readable success message. | `"File uploaded successfully."` |

#### JSON Representation
```json
{
  "fileName": "report_copy1.pdf",
  "path": "docs",
  "sizeBytes": 2048,
  "message": "File uploaded successfully."
}
```

---

### 1.2 `FileSystemItem` (Frontend Client Model)

Represents an item displayed in the File Explorer table.

| Field Name | Type | Description |
|------------|------|-------------|
| `name` | `string` | Name of the file or folder. |
| `size` | `string` | Byte count formatted as a string (or `"-"` for folders). |
| `type` | `'file' \| 'folder'` | Discriminator indicating item type. |

When an upload completes, the frontend constructs a new `FileSystemItem`:
```typescript
const newItem: FileSystemItem = {
  name: uploadResult.fileName,
  size: uploadResult.sizeBytes.toString(),
  type: 'file',
};
```

---

### 1.3 `DirectoryItemSummary` (View State Summary)

Represents the counts shown in the bottom footer (`#item-counts-summary`).

| Field Name | Type | Calculation Rule |
|------------|------|------------------|
| `folderCount` | `number` | Count of items where `type === 'folder'`. Unchanged on file upload. |
| `fileCount` | `number` | Count of items where `type === 'file'`. Increments by 1 on successful upload. |

---

## 2. Validation Rules

| Rule ID | Entity / Scope | Constraint | Error Code / Behavior |
|---------|----------------|------------|-----------------------|
| `VAL-001` | Upload Request | `file` must not be null or missing | `400 Bad Request` (`"File is required."`) |
| `VAL-002` | Upload Request | `file.Length` must be `<= 8,388,608` bytes (8 MB) | `400 Bad Request` (`"File exceeds the maximum allowed size of 8 MB."`) |
| `VAL-003` | Destination Path | Target folder path must reside strictly within storage root (no traversal `..` or absolute path) | `400 Bad Request` (`"Invalid path or path traversal detected."`) |
| `VAL-004` | Destination Path | Target folder must exist on disk | `404 Not Found` (`"Destination directory not found."`) |
| `VAL-005` | Filename Conflict | If target file already exists, MUST NOT overwrite | Automatically resolved via `_copyN` suffix sequence |

---

## 3. Conflict Resolution State Flow

```
[Start Upload: targetFolder, originalName]
              │
              ▼
   Does target file exist?
     ├── NO  ──> Save as originalName
     │
     └── YES ──> Initialize copyIndex = 1
                      │
                      ▼
             Generate candidateName:
             ${baseName}_copy${copyIndex}${extension}
                      │
                      ▼
             Does candidate exist?
               ├── YES ──> copyIndex++ ──> (Repeat check)
               │
               └── NO  ──> Save as candidateName
```
