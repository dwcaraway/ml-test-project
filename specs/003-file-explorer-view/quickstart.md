# Quickstart & Validation Guide: Frontend File Explorer View

This guide provides runnable end-to-end scenarios to validate the implementation of the Frontend File Explorer View and Breadcrumb Navigation.

---

## Prerequisites

1. Backend Web API built and running (`cd backend && dotnet run`).
2. Frontend development server running (`cd frontend && npm run dev`).
3. Root storage directory initialized with sample nested folders:
   ```powershell
   mkdir ./storage/level1/level2/level3/level4 -Force
   Set-Content ./storage/file1.txt "Root file content"
   Set-Content ./storage/level1/level2/level3/level4/deep.txt "Deep nested file"
   ```

---

## Automated Verification Suite

Run the full frontend test suite:

```bash
cd frontend
npm test
npm run typecheck
```

**Expected Outcome**: All Vitest unit tests (component tests, router query handling, breadcrumb collapsing, and download links) and TypeScript type checks pass with 0 errors.

---

## Interactive Validation Scenarios

### Scenario 1: Browse Root Directory
1. Open [`http://localhost:3000`](http://localhost:3000) in your browser.
2. Click the **Files** link in the top navigation bar (navigating to [`http://localhost:3000/files`](http://localhost:3000/files)).
3. **Verify**:
   - The view title is "Files - SPA Explorer".
   - The file table lists items in the storage root.
   - Folders display `"-"` in the Size column.
   - Files display their size and have a visible "Download" link beside them.
   - No breadcrumb is displayed (or only root indicator) because the current directory is root.

---

### Scenario 2: Navigate into a Folder
1. Click on the `level1` folder link in the table.
2. **Verify**:
   - The URL changes to `http://localhost:3000/files?path=level1`.
   - The table updates to show contents of `level1`.
   - A breadcrumb appears at the top: `Home > level1`.
   - `Home` is clickable; `level1` is the active item (not clickable).

---

### Scenario 3: Navigate Deeply (> 3 Levels) & Ellipsis Collapsing
1. Navigate down through `level1` &rarr; `level2` &rarr; `level3` &rarr; `level4`.
2. The URL is `http://localhost:3000/files?path=level1/level2/level3/level4`.
3. **Verify**:
   - Because depth is 4 levels below root (> 3), the breadcrumb displays:
     `Home > ... > level4`.
   - The `...` segment is an interactive button.

---

### Scenario 4: Expand Truncated Breadcrumb
1. Click the `...` button in the breadcrumb trail.
2. **Verify**:
   - The breadcrumb expands inline to reveal:
     `Home > level1 > level2 > level3 > level4`.
   - Clicking `level2` immediately navigates to `http://localhost:3000/files?path=level1/level2`.

---

### Scenario 5: File Download Trigger
1. Return to the root folder or navigate to a folder containing a file.
2. Click the **Download** link beside `file1.txt`.
3. **Verify**:
   - The browser initiates a direct download of `file1.txt` targeting `/api/download?path=file1.txt`.
   - The downloaded file contents match `"Root file content"`.

---

### Scenario 6: Browser Back & Forward Navigation
1. From `level4`, click the browser's **Back** button.
2. **Verify**:
   - The URL reverts to the previous path.
   - The table and breadcrumb refresh to display the previous folder's contents without reloading the page.
