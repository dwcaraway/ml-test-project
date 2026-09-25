# Quickstart & Validation Guide: File Upload with Conflict Renaming

This guide provides runnable end-to-end scenarios to validate the implementation of the File Upload with Conflict Renaming and Size Limits feature.

---

## Prerequisites

1. Backend Web API built and running:
   ```bash
   cd backend
   dotnet run
   ```
2. Frontend development server running:
   ```bash
   cd frontend
   npm run dev
   ```
3. Test storage directory seeded with sample items:
   ```powershell
   New-Item -ItemType Directory -Path ./storage/docs -Force
   Set-Content ./storage/docs/existing.txt "Original file content"
   ```

---

## Automated Verification Suite

Run frontend and backend automated test suites:

```bash
# Frontend tests and type checks
cd frontend
npm test
npm run typecheck

# Backend tests
cd ../backend
dotnet test
```

**Expected Outcome**: All Vitest frontend tests and all xUnit backend integration tests pass with 0 errors.

---

## Interactive Validation Scenarios

### Scenario 1: Upload a New File to Current Folder
1. Open [`http://localhost:3000/files`](http://localhost:3000/files) in the browser.
2. Note the file count at the bottom (e.g., `Files: 3`).
3. Click the **Upload** link above and to the right of the File Explorer view.
4. Select a local file smaller than 8 MB (e.g., `sample-upload.txt`).
5. **Verify**:
   - `sample-upload.txt` appears in the File Explorer table.
   - The file size matches the uploaded file's byte count.
   - The `Files:` count at the bottom increments by 1.
   - The file exists on disk inside `./storage/sample-upload.txt`.

---

### Scenario 2: Filename Collision & Automatic `_copy1` Renaming
1. While still viewing [`http://localhost:3000/files`](http://localhost:3000/files), click **Upload** again.
2. Select the same file (`sample-upload.txt`).
3. **Verify**:
   - The original `sample-upload.txt` is preserved.
   - A new file named `sample-upload_copy1.txt` appears in the table.
   - The `Files:` count at the bottom increments by 1.
   - Both `sample-upload.txt` and `sample-upload_copy1.txt` exist in `./storage/`.

---

### Scenario 3: Sequential Conflict Renaming (`_copy2`)
1. Click **Upload** a third time and select `sample-upload.txt`.
2. **Verify**:
   - A new file named `sample-upload_copy2.txt` appears in the table.
   - The `Files:` count increments by 1.

---

### Scenario 4: Uploading to a Subdirectory
1. Click on the `docs` folder in the table to navigate to `/files?path=docs`.
2. Click the **Upload** link.
3. Select `nested-note.txt`.
4. **Verify**:
   - `nested-note.txt` appears in the `docs` directory table.
   - The file is saved inside `./storage/docs/nested-note.txt`.

---

### Scenario 5: File Size Limit Enforcement (> 8 MB)
1. Prepare a dummy file larger than 8 MB (e.g. 9 MB):
   ```powershell
   $bigData = New-Object byte[] (9 * 1024 * 1024)
   [IO.File]::WriteAllBytes("./big-file.bin", $bigData)
   ```
2. In the browser, click **Upload** and select `big-file.bin`.
3. **Verify**:
   - An error banner is displayed: `File exceeds the maximum allowed size of 8 MB.`
   - The file is NOT uploaded or saved to `./storage`.
   - The file table and file count remain unchanged.

---

### Scenario 6: Boundary & Traversal Protection (API Security)
1. Using curl or PowerShell, send an upload request attempting directory traversal:
   ```bash
   curl -X POST "https://localhost:7146/api/upload?path=../" -F "file=@./storage/docs/existing.txt"
   ```
2. **Verify**:
   - The server responds with HTTP `400 Bad Request`.
   - No files are written outside the storage root.
