# Research & Technical Decisions: File Upload with Conflict Renaming

**Feature**: File Upload with Conflict Renaming and Size Limits  
**Feature Directory**: `specs/005-file-upload`  

---

## 1. File Upload Web API Protocol & Payload

### Decision
Use standard `multipart/form-data` HTTP `POST /api/upload` endpoint:
- **Route**: `POST /api/upload?path={folderPath}`
- **Form Field**: `file` (`IFormFile`)
- **Query Parameter**: `path` (optional string, specifies relative destination folder within storage root; defaults to root `""`).

### Rationale
- Native browser `<form>` and `FormData` API support multipart streaming natively.
- Eliminates 33% payload expansion and memory bloat associated with Base64 JSON encoding.
- Compatible with ASP.NET Core's built-in `IFormFile` streaming and model binding.

### Alternatives Considered
- **Base64 JSON Body (`POST /api/upload`)**: Encoding files into JSON strings wastes CPU cycles and expands network payload size by ~33%. It also forces buffering in memory. Rejected.
- **Raw Octet Stream (`POST /api/upload` with custom headers)**: Requires custom middleware to parse headers for filename and destination, lacking standard browser `FormData` interoperability. Rejected.

---

## 2. 8 MB File Size Validation

### Decision
Enforce the 8 MB (`8,388,608 bytes`) limit at two levels:
1. **Client-Side Validation (Fast Feedback)**:
   - Before dispatching network request, inspect `file.size`.
   - If `file.size > 8 * 1024 * 1024`, immediately abort and display error banner: `"File exceeds the maximum allowed size of 8 MB."`
2. **Server-Side Validation (Security Authority)**:
   - In `FileBrowserController` / `FileBrowserService`, check `file.Length > 8 * 1024 * 1024` (or `file.Length == 0` if empty uploads are guarded or handled).
   - If exceeded, return `400 Bad Request` with `{ "error": "File exceeds the maximum allowed size of 8 MB." }`.
   - Configure `[RequestSizeLimit(10 * 1024 * 1024)]` on controller endpoint to reject excessively huge uploads early.

### Rationale
- Dual validation ensures responsive UX for legitimate users while guaranteeing server integrity against malicious or direct API callers.

---

## 3. Filename Conflict Resolution (`_copyN`)

### Decision
Implement deterministic collision resolution without overwriting existing files:
1. Extract base name and extension from uploaded file:
   - Example: `contract.pdf` &rarr; base: `contract`, extension: `.pdf`
   - Example: `README` &rarr; base: `README`, extension: `""`
2. Check if file already exists in target directory:
   - If `!File.Exists(targetFilePath)`, use the original filename.
   - If it exists, iterate `counter` from 1 upwards:
     - Generate candidate name: `${base}_copy${counter}${extension}`
     - If candidate does not exist, select candidate name and exit loop.
3. Open target stream using `FileMode.CreateNew` inside a guarded block to ensure race-safe atomic creation on the filesystem.

### Rationale
- Satisfies requirement FR-004, FR-005, and FR-006.
- Preserves file extensions so file types remain valid on OS and browser.
- Transparently handles multiple consecutive uploads with the same name.

---

## 4. UI Placement & Native File Selector Integration

### Decision
- Render an **Upload** button or link in `.explorer-header` positioned to the right of the directory heading (Files / current folder).
- Style with CSS: flex layout in `.explorer-header` with `justify-content: space-between` and `align-items: center`.
- Create a hidden `<input type="file" class="file-upload-input" style="display: none;" aria-hidden="true">` inside the view wrapper.
- When the user clicks the "Upload" action, call `input.click()` to trigger the OS native file dialog.
- On file selection (`input.addEventListener('change', ...)`):
  - Read `input.files[0]`.
  - Validate file size.
  - Call `uploadFile(currentPath, file)`.
  - On success: insert the returned file into `this.items`, sort entries (folders first, then files alphabetically), increment file counter, and re-render.
  - Reset `input.value = ''` so the user can re-upload the same file or another file if desired.

### Rationale
- Meets Constitution Principle I (Vanilla TypeScript, native DOM APIs) and Principle IV (Simplicity, function over styling).
- Accessible and responsive on desktop and mobile browsers.

---

## 5. Storage Boundary & Path Traversal Guard

### Decision
Reuse existing `ResolveAndValidatePath(destinationPath, mustBeDirectory: true)` in `FileBrowserService`:
- Resolves destination path against `_options.GetCanonicalRootPath()`.
- Rejects path traversal (`..`, `..\\`) with `SecurityException` (`400 Bad Request`).
- Verifies destination directory exists; if directory not found, throws `DirectoryNotFoundException` (`404 Not Found`).
