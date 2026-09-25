# Feature Specification: File Explorer Item Counts and Secure Deletion

**Feature Branch**: `004-item-deletion-and-counts`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "The file explorer view in the frontend must count the number of folders and the number of files (not including folders) on the current page results from the web api and display this at the bottom of the view. Add an /api/delete endpoint to the API. Calling /api/delete with a file path will attempt to delete the item at that path. Just like with /api/browse and /api/download, deletions are dangerous so do not let the user delete items outside of the browser root folder! If deletion fails, respond with an error code. On the front end, add a delete link to the right of files and folders now to delete that item. Once an item is deleted successfully, it should no longer show on the frontend or in the file or folder count. Since accidental deletions happen, make sure to pop up a prompt to ask the user if they are sure that they wish to delete the item and indicate that this action is not recoverable."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Folder and File Counts Summary (Priority: P1)

A user views the contents of a directory in the file explorer and expects a clear summary at the bottom of the page showing the total number of folders and the total number of files in the current view.

**Why this priority**: Core observability requirement that provides situational awareness of directory contents and serves as the baseline visual counter for item additions and deletions.

**Independent Test**: Navigate to any directory containing a mix of files and folders; verify that the bottom of the view displays the accurate count of folders and files (e.g., "Folders: 2 | Files: 3").

**Acceptance Scenarios**:

1. **Given** a directory containing 2 folders and 3 files, **When** the directory contents load, **Then** the bottom of the view displays a count showing 2 folders and 3 files.
2. **Given** an empty directory containing 0 folders and 0 files, **When** the directory loads, **Then** the bottom of the view displays 0 folders and 0 files.
3. **Given** a directory containing only folders (e.g., 4 folders and 0 files), **When** viewed, **Then** the summary reflects 4 folders and 0 files, ensuring folders are not miscounted as files.

---

### User Story 2 - Safe Item Deletion with Confirmation (Priority: P2)

A user wants to remove an unnecessary file or folder from the file explorer interface. To protect against accidental loss, the user is presented with a confirmation prompt warning that the deletion cannot be undone. Upon confirming, the item is removed, the file list updates immediately, and the item counters decrease accordingly.

**Why this priority**: High-impact management feature that allows users to clean up storage safely with safeguard prompts against accidental data loss.

**Independent Test**: Click the delete action for a specific file or folder; verify a prompt appears warning that the action is not recoverable. Cancel the prompt and verify the item remains. Click delete again, confirm the prompt, and verify the item disappears from the table and the bottom counters decrement by 1.

**Acceptance Scenarios**:

1. **Given** a directory listing with files and folders, **When** the user views the table, **Then** a visible "Delete" link/action is present for each folder and file item in the actions area.
2. **Given** a user clicks the delete action on an item, **When** the prompt appears, **Then** the prompt asks if the user is sure they want to delete the item and explicitly warns that the action is not recoverable.
3. **Given** the confirmation prompt is displayed, **When** the user cancels or dismisses the prompt, **Then** no deletion occurs and the item remains visible in the list.
4. **Given** the confirmation prompt is displayed, **When** the user confirms deletion and the operation succeeds, **Then** the deleted item is removed from the screen and the bottom folder/file counter updates immediately.
5. **Given** the user deletes the only item in a directory, **When** deletion completes, **Then** the view transitions to the empty state and the summary reports 0 folders and 0 files.

---

### User Story 3 - Secure Server Deletion Endpoint with Boundary Protection (Priority: P3)

The system provides a dedicated deletion endpoint that permanently deletes a specified file or directory, while rigorously verifying that the target path resides strictly within the storage root directory to prevent unauthorized data destruction outside bounds.

**Why this priority**: Essential backend foundation for executing deletions safely, enforcing path traversal protection, and returning structured error codes when operations fail.

**Independent Test**: Send deletion requests targeting existing files, subdirectories, nonexistent paths, and traversal paths (such as `../outside.txt`); verify valid items are deleted, while traversal or invalid requests fail with descriptive error codes.

**Acceptance Scenarios**:

1. **Given** a valid relative path to an existing file within the storage root, **When** a deletion request is sent to the deletion endpoint, **Then** the server deletes the file and returns a success response.
2. **Given** a valid relative path to an existing folder within the storage root, **When** a deletion request is sent, **Then** the server deletes the folder and all its contents and returns a success response.
3. **Given** a path attempting directory traversal (e.g., `../sensitive.txt` or absolute system paths), **When** a deletion request is sent, **Then** the server rejects the request with an error code and preserves the external file.
4. **Given** a request targeting a non-existent item, **When** the deletion request is processed, **Then** the server responds with a not-found error code.
5. **Given** a request targeting the storage root itself (empty path or `/`), **When** sent, **Then** the server rejects the request to prevent deleting the root container.

---

### Edge Cases

- **Deleting Nested/Non-Empty Folders**: When deleting a folder that contains files or subfolders, the deletion operation deletes the entire subtree recursively.
- **Root Directory Protection**: Attempts to delete the root folder (e.g., path `""` or `"/"`) are strictly blocked with an error response.
- **Simultaneous Deletion / Race Conditions**: If an item was already deleted in another session or on disk before the user clicks confirm, the server returns an appropriate not-found error code and the interface informs the user.
- **Server or Network Failure**: If the deletion request fails due to network outage or server error, a prominent error message is displayed, and the item remains in the UI list.
- **Items with Special Characters**: File and folder names containing spaces, commas, ampersands, or non-ASCII characters are safely handled without breaking URL formatting or backend path resolution.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST compute the total number of folders on the current directory view and the total number of files (excluding folders) on the current directory view.
- **FR-002**: System MUST display the folder count and file count prominently at the bottom of the File Explorer view.
- **FR-003**: System MUST update the folder and file counts immediately whenever items are removed or the directory contents change without requiring a full page refresh.
- **FR-004**: System MUST provide an accessible "Delete" link or button for every folder item displayed in the directory table.
- **FR-005**: System MUST provide an accessible "Delete" link or button for every file item displayed in the directory table.
- **FR-006**: When a user clicks any "Delete" action, the system MUST display a confirmation prompt requiring explicit user confirmation before initiating deletion.
- **FR-007**: The confirmation prompt MUST explicitly state the name of the item to be deleted and warn that the action is permanent and not recoverable.
- **FR-008**: If the user declines or cancels the confirmation prompt, the system MUST NOT initiate any deletion request, leaving the item and view unchanged.
- **FR-009**: System MUST provide a server endpoint (`/api/delete`) that accepts an item path parameter to delete the target file or folder.
- **FR-010**: The server endpoint MUST validate that the target path resides strictly within the configured storage root directory.
- **FR-011**: The server endpoint MUST reject any path containing directory traversal sequences (`..`), invalid path characters, or targeting paths outside the storage root with a client error code.
- **FR-012**: The server endpoint MUST reject any attempt to delete the root directory itself.
- **FR-013**: If the target item does not exist, the server endpoint MUST respond with an appropriate not-found error code.
- **FR-014**: If the deletion operation fails due to system or permission errors, the server endpoint MUST respond with an error code and meaningful failure description.
- **FR-015**: When a deletion succeeds, the frontend MUST immediately remove the deleted item from the view and refresh the folder and file counts.
- **FR-016**: If a deletion fails on the server, the frontend MUST display a clear, accessible error notification and retain the item in the list.

---

### Key Entities

- **DirectoryItemSummary**: Represents the aggregate counts of items visible in the current view:
  - `folderCount`: non-negative integer indicating total folders in the current view.
  - `fileCount`: non-negative integer indicating total files (excluding folders) in the current view.
- **DeletionRequest**: Represents the intent to delete an item:
  - `path`: relative path of the item to be deleted within the storage root.
  - `confirmed`: boolean indicating whether the user approved the unrecoverable action prompt.
- **DeletionOutcome**: Represents the result of a deletion attempt:
  - `success`: boolean indicating whether the item was successfully removed.
  - `errorMessage`: optional textual description if the operation failed.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of directory views accurately display the folder count and file count matching the items displayed in the table.
- **SC-002**: 100% of user-initiated delete clicks trigger an explicit confirmation warning prior to any network request.
- **SC-003**: 0% of path traversal attempts (such as `../`) or external file references succeed in deleting files outside the storage root directory.
- **SC-004**: Upon confirmation of a valid deletion, the item disappears from the screen and the count updates in under 1 second under normal network conditions.
- **SC-005**: 100% of failed deletion requests produce an informative error message explaining the failure to the user without breaking existing view state.

---

## Assumptions

- The existing single-page application router and File Explorer view from feature `003-file-explorer-view` will host the new count footer and delete actions.
- The existing backend storage root configuration (`FILE_BROWSER_ROOT`) governs the boundary for all deletion operations, matching `/api/browse` and `/api/download`.
- Folder deletions are recursive by default, meaning deleting a folder will remove all contained nested files and subdirectories.
- The confirmation prompt can be implemented using standard browser modal dialogs (e.g. `window.confirm`) or a styled in-page dialog, as long as it clearly warns about unrecoverable data loss and blocks execution until confirmed.
- The delete action is rendered in the existing table's Actions column, adjacent to the download link for files, and as the primary action for folders.
