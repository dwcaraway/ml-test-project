# Quickstart & Validation Guide: File & Directory Browsing Web API

This guide provides runnable scenarios to validate the implementation of the File & Directory Browsing and Download API.

## Prerequisites
- .NET 8.0 SDK installed.
- PowerShell or terminal environment.

## Setup & Preparation

1. **Prepare a sample storage folder**:
   ```powershell
   mkdir ./storage/sample-docs -Force
   Set-Content ./storage/sample-docs/note.txt "Hello from file browser!"
   Set-Content ./storage/sample-docs/data.csv "id,name`n1,Alpha`n2,Beta"
   Set-Content ./storage/root-file.txt "Top-level file contents."
   ```

2. **Build the backend**:
   ```bash
   cd backend
   dotnet build
   ```

---

## Automated Verification Suite

Run the backend automated test suite:

```bash
cd backend
dotnet test
```

**Expected Outcome**: All unit tests (path traversal, size formatting, pagination) and integration tests (`/api/browse`, `/api/download`, startup probe) pass cleanly with 0 errors.

---

## Interactive Verification Scenarios

### Scenario 1: Browse Root Directory
1. Start the server (with `FILE_BROWSER_ROOT` pointing to your storage directory, or unset to use `./storage`):
   ```bash
   cd backend
   dotnet run
   ```
2. In another terminal or browser, request root directory contents:
   ```bash
   curl -i "https://localhost:7146/api/browse" -k
   ```
3. **Verify**:
   - HTTP 200 OK.
   - JSON includes `currentPath: ""`, `totalCount`, `items`.
   - Folder `sample-docs` has `size: "-"`.
   - File `root-file.txt` has its numeric file size in `size`.

### Scenario 2: Browse Subfolder with Pagination
1. Query the `sample-docs` folder with a page size of 1:
   ```bash
   curl -i "https://localhost:7146/api/browse?path=sample-docs&page=1&pageSize=1" -k
   ```
2. **Verify**:
   - `page: 1`, `pageSize: 1`, `totalCount: 2`, `totalPages: 2`.
   - Response contains exactly 1 item.
3. Query page 2:
   ```bash
   curl -i "https://localhost:7146/api/browse?path=sample-docs&page=2&pageSize=1" -k
   ```
4. **Verify**:
   - Response returns the next file item.

### Scenario 3: Download File
1. Download `root-file.txt`:
   ```bash
   curl -i "https://localhost:7146/api/download?path=root-file.txt" -k
   ```
2. **Verify**:
   - HTTP 200 OK.
   - Header `Content-Disposition: attachment; filename="root-file.txt"`.
   - Response body matches `"Top-level file contents."`.

### Scenario 4: Path Traversal Attack Prevention
1. Attempt to browse outside root using traversal tokens:
   ```bash
   curl -i "https://localhost:7146/api/browse?path=../../" -k
   ```
2. **Verify**:
   - HTTP 400 Bad Request.
   - Body contains an error message indicating invalid path or path traversal.

### Scenario 5: Attempting to Download a Directory
1. Attempt to download a folder path:
   ```bash
   curl -i "https://localhost:7146/api/download?path=sample-docs" -k
   ```
2. **Verify**:
   - HTTP 400 Bad Request indicating the target is a directory, not a file.

### Scenario 6: Startup Fail-Fast Verification
1. Start the backend with an unwritable or nonexistent read-only path:
   ```powershell
   $env:FILE_BROWSER_ROOT = "Z:\nonexistent_drive_root"
   dotnet run
   ```
2. **Verify**:
   - Application halts immediately with a fatal `InvalidOperationException` describing the directory access failure before binding to HTTP ports.
