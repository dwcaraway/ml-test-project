# Quickstart & Validation Guide: Item Counts & Deletion

This guide provides runnable end-to-end scenarios to validate the implementation of the File Explorer Item Counts and Deletion feature.

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
   New-Item -ItemType Directory -Path ./storage/test-dir -Force
   Set-Content ./storage/test-file.txt "Temporary test file"
   Set-Content ./storage/test-dir/nested.txt "Nested content"
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

**Expected Outcome**: All Vitest component/view tests and all xUnit backend integration tests pass with 0 errors.

---

## Interactive Validation Scenarios

### Scenario 1: Verify Item Counts at Directory Bottom
1. Open [`http://localhost:3000/files`](http://localhost:3000/files) in the browser.
2. Scroll to the bottom of the table.
3. **Verify**:
   - The footer displays: `Folders: {count} | Files: {count}`.
   - The number of folders matches the number of folder rows in the table.
   - The number of files matches the number of file rows in the table.

---

### Scenario 2: Cancel Deletion Confirmation
1. Locate `test-file.txt` in the File Explorer table.
2. Click the **Delete** link in the Actions column for `test-file.txt`.
3. **Verify**:
   - A confirmation prompt pops up asking:
     `Are you sure you want to delete "test-file.txt"? This action is not recoverable.`
4. Click **Cancel** on the prompt.
5. **Verify**:
   - `test-file.txt` remains visible in the table.
   - The folder and file counts at the bottom remain unchanged.
   - The file still exists on disk in `./storage/test-file.txt`.

---

### Scenario 3: Confirm File Deletion
1. Click the **Delete** link for `test-file.txt`.
2. Click **OK** (confirm) on the prompt.
3. **Verify**:
   - `test-file.txt` immediately disappears from the table.
   - The Files count in the footer decrements by 1.
   - The file is deleted from `./storage/test-file.txt`.

---

### Scenario 4: Confirm Folder Deletion
1. Click the **Delete** link for `test-dir`.
2. Click **OK** (confirm) on the prompt.
3. **Verify**:
   - `test-dir` immediately disappears from the table.
   - The Folders count in the footer decrements by 1.
   - The folder and its nested contents are removed from disk.

---

### Scenario 5: Traversal Protection (API Security)
1. Using curl or PowerShell, send a deletion request attempting to delete outside root:
   ```bash
   curl -X DELETE "https://localhost:7146/api/delete?path=../appsettings.json"
   ```
2. **Verify**:
   - The server responds with HTTP `400 Bad Request`.
   - `appsettings.json` is preserved and untouched.

---

### Scenario 6: Root Deletion Protection
1. Attempt to delete the root directory:
   ```bash
   curl -X DELETE "https://localhost:7146/api/delete?path="
   ```
2. **Verify**:
   - The server responds with HTTP `400 Bad Request`.
   - The storage root is preserved.
