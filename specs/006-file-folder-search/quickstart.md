# Quickstart & Validation Guide: Recursive File and Folder Search with Pagination

This guide provides runnable end-to-end validation scenarios for the Recursive File and Folder Search feature.

---

## Prerequisites

1. **Backend Web API running:**
   ```bash
   cd backend
   dotnet run
   ```
2. **Frontend development server running:**
   ```bash
   cd frontend
   npm run dev
   ```
3. **Storage directory seeded with sample data:**
   ```powershell
   ./seed-storage.ps1
   ```
   Or manually seed nested folders and files:
   ```powershell
   New-Item -ItemType Directory -Path ./storage/docs/archive -Force
   Set-Content ./storage/docs/archive/test-report.txt "Test report content"
   Set-Content ./storage/docs/test-summary.txt "Summary content"
   New-Item -ItemType Directory -Path ./storage/test-folder -Force
   ```

---

## Automated Verification Suite

Run automated unit and integration tests across both frontend and backend:

```bash
# Frontend validation
cd frontend
npm test
npm run typecheck

# Backend validation
cd ../backend
dotnet test
```

**Expected Outcome**: All Vitest frontend tests and all xUnit backend integration tests pass with 0 errors.

---

## Interactive Validation Scenarios

### Scenario 1: Search Files and Folders with Type Sorting (Folders First)

1. Open [`http://localhost:3000/files`](http://localhost:3000/files) in the browser.
2. Observe the search box positioned immediately to the left of the **Upload** link in the header.
3. In the search box, enter `test` and press **Enter** (or click **Search**).
4. **Verify**:
   - The spinning icon appears while the search request is in flight.
   - The view switches to search results mode.
   - The search box remains visible above the search results table.
   - The **Upload** button is hidden from view.
   - Results include both matching folders (e.g., `test-folder`) and matching files (e.g., `test-summary.txt`, `test-report.txt`).
   - All folder results appear at the top of the table before any file results.
   - Folders display `"-"` for size; files display their byte size.

---

### Scenario 2: Search Results Pagination (1 .. N)

1. Seed or search for a broad term that matches more than one page of results (e.g., 60+ items).
2. Execute the search.
3. Scroll to the bottom of the File Explorer view.
4. **Verify**:
   - Numbered pagination buttons (`1`, `2`, `...`) are visible at the bottom of the explorer.
   - Page `1` is highlighted/selected as the active page.
   - Click page button `2`.
   - The spinning icon appears momentarily while page 2 is fetched.
   - The table updates to show the second page of matching items.
   - Page `2` is now visually marked as active.

---

### Scenario 3: Folder Navigation from Search Results

1. While in search results mode from Scenario 1, locate a matching folder row (e.g., `test-folder`).
2. Click on the folder name.
3. **Verify**:
   - The explorer exits search results mode and enters browsing mode for `test-folder`.
   - The breadcrumb bar updates to show the folder path.
   - The contents of `test-folder` are listed in the table.
   - The **Upload** button is restored to the right of the search box in the header.

---

### Scenario 4: Global Operation Loading Spinner Verification

1. **Search Spinner**:
   - Type a query into the search box and trigger search.
   - **Verify**: The spinning icon appears next to the search box until results render, then disappears.
2. **Upload Spinner**:
   - In browse mode, click **Upload** and pick a valid file.
   - **Verify**: The spinning icon appears while the file is transferring and disappears when the upload completes and the table updates.
3. **Delete Spinner**:
   - In browse mode, click **Delete** on an item and confirm the browser prompt.
   - **Verify**: The spinning icon appears while the delete request is processed and disappears when the item is removed.

---

### Scenario 5: Root Escape & Traversal Prevention (API Security)

1. Send an HTTP search request attempting path traversal using curl or PowerShell:
   ```bash
   curl -i "https://localhost:7146/api/search?path=../&query=test"
   ```
2. **Verify**:
   - The server immediately responds with HTTP `400 Bad Request`.
   - The response body indicates path traversal detection.
   - No filesystem access outside the storage root is permitted.
