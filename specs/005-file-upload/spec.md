# Feature Specification: File Upload with Conflict Renaming and Size Limits

**Feature Branch**: `005-file-upload`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "This feature allows the the user to upload a file using the file explorer or web api. the file size allowed is a maxiumum of 8 mb. An upload link is displayed above and to the right of the file explorer view. When the user selects the upload link, use the system default file selector to upload. The uploaded file will be placed in the current folder. A user may not overwrite an existing file. Instead if the file name conflicts with an existing file, add a postfix to the name with _copy followed by a number (e.g. _copy1, or if that exists, _copy2 and so forth). After an upload, the file count should be updated."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure File Upload via Web API with Conflict Resolution (Priority: P1)

An automated client or external system uses the Web API to upload files to a target directory. The API enforces an 8 MB maximum file size limit, places the file in the designated folder, guarantees existing files are never overwritten by auto-generating sequential `_copyN` suffixes upon collision, and validates that target paths do not escape the storage boundary.

**Why this priority**: Forms the core functional and security foundation for receiving, storing, and deduplicating uploaded data. Can be tested independently of any user interface.

**Independent Test**: Send HTTP upload requests with files under 8 MB to target directories; verify files are saved successfully in the target folder, files over 8 MB are rejected, paths with directory traversal are blocked, and existing files remain untouched while the new file is stored with an incremented `_copyN` name.

**Acceptance Scenarios**:

1. **Given** a valid file under 8 MB and a valid target folder path, **When** the upload API endpoint is invoked, **Then** the file is saved to the destination folder and a success response is returned with file details.
2. **Given** a file named `document.pdf` already exists in the target folder, **When** a user uploads another file named `document.pdf`, **Then** the existing file is preserved unmodified and the new file is saved as `document_copy1.pdf`.
3. **Given** `document.pdf` and `document_copy1.pdf` both already exist in the target folder, **When** a user uploads another `document.pdf`, **Then** the new file is saved as `document_copy2.pdf`.
4. **Given** an uploaded file exceeding 8 MB (8,388,608 bytes), **When** an upload is attempted, **Then** the request is rejected with a client error message indicating the 8 MB limit was exceeded and no file is stored.
5. **Given** a destination path attempting directory traversal (e.g., `../outside`), **When** an upload is attempted, **Then** the request is rejected with an error and no file is saved outside the storage root.

---

### User Story 2 - Upload Action and System File Picker in File Explorer (Priority: P2)

A user navigating the File Explorer views a prominent "Upload" link positioned above and to the right of the directory view. Clicking this link opens the native system file selector. Upon selecting a file, the file is automatically uploaded to the folder currently being viewed. When the upload completes, the file immediately appears in the directory listing and the file count at the bottom increments.

**Why this priority**: Delivers the primary user interface capability allowing users to upload files directly into their currently viewed folder.

**Independent Test**: Navigate to any folder (including root and nested subfolders); click the "Upload" action above and to the right of the view; choose a file via the system file picker; verify the file appears in the list and the footer file count increments by 1 without requiring a full page refresh.

**Acceptance Scenarios**:

1. **Given** a user is viewing any directory in the File Explorer, **When** the view loads, **Then** an "Upload" link or button is visibly positioned above and to the right of the file listing area.
2. **Given** the user clicks the "Upload" link, **When** activated, **Then** the operating system's native file picker opens allowing the user to choose a file.
3. **Given** a user selects a file from the picker, **When** the file is selected, **Then** the system uploads the file to the current directory being viewed.
4. **Given** an upload succeeds, **When** the operation finishes, **Then** the uploaded file is added to the visible directory listing and the summary file counter increments by 1.
5. **Given** a user cancels or dismisses the file picker without selecting a file, **When** dismissed, **Then** no upload is initiated and the current directory view and counts remain unchanged.

---

### User Story 3 - Transparent Conflict Notification & Size Validation Feedback (Priority: P3)

A user attempting to upload a file receives clear, immediate feedback if the file exceeds the 8 MB threshold or if the file was automatically renamed to prevent overwriting existing content.

**Why this priority**: Enhances usability and data integrity by providing clear visibility into why an upload was refused or what final name was assigned to the file on disk.

**Independent Test**: Attempt to upload a 9 MB file and verify an error notification informs the user of the 8 MB maximum size. Next, upload a file sharing a name with an existing file and verify the UI shows the new file with its `_copyN` name while the original file remains in the list.

**Acceptance Scenarios**:

1. **Given** a user selects a file larger than 8 MB in the file picker, **When** upload is initiated, **Then** the system prevents or rejects the upload and displays an accessible message: "File exceeds the maximum allowed size of 8 MB."
2. **Given** an uploaded file is renamed due to a naming collision (e.g., `image.png` renamed to `image_copy1.png`), **When** the view updates, **Then** both `image.png` and `image_copy1.png` appear in the table, and the file count increases by 1.
3. **Given** an upload fails due to network or server interruption, **When** the failure occurs, **Then** an error banner is presented and the directory contents remain in their previous valid state.

---

### Edge Cases

- **File Without Extension**: When uploading an extensionless file named `LICENSE` that already exists, the postfix is appended directly (`LICENSE_copy1`, `LICENSE_copy2`).
- **File With Multiple Dots / Complex Extensions**: For files such as `archive.tar.gz`, the postfix is inserted before the final extension (`archive.tar_copy1.gz`), or before the complete extension per convention.
- **Empty / 0-Byte Files**: Valid 0-byte files within the 8 MB limit are accepted and created without error.
- **Uploading to the Root Directory**: When viewing the root storage path (`/` or `""`), files are uploaded directly into the root folder.
- **Uploading into Deeply Nested Directories**: Uploads to subfolders (`docs/quarterly/2026`) correctly place the file inside the exact active subfolder.
- **Special Characters in Filename**: Filenames containing spaces, Unicode characters, commas, and parentheses are safely received and persisted without corrupting URLs or storage paths.
- **Concurrent Uploads with Identical Names**: If two uploads with the same name happen concurrently, the system sequentially assigns unique postfixes (`_copy1`, `_copy2`) ensuring neither overwrites the other.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an HTTP API endpoint accepting file uploads targeting any specified directory path within the storage boundary.
- **FR-002**: System MUST reject any uploaded file whose size strictly exceeds 8 MB (8,388,608 bytes) with a client error message.
- **FR-003**: System MUST validate that the destination directory resides strictly within the storage root and reject any path traversal attempts (`..`, absolute paths) with a client error.
- **FR-004**: System MUST NOT overwrite any existing file on disk during an upload.
- **FR-005**: When an uploaded file has a filename conflict with an existing item in the target directory, the system MUST append `_copy1` before the file extension.
- **FR-006**: If `_copy1` already exists, the system MUST increment the postfix sequentially (`_copy2`, `_copy3`, etc.) until a non-conflicting filename is found.
- **FR-007**: System MUST display an "Upload" link or button positioned above and to the right of the File Explorer view.
- **FR-008**: Selecting the "Upload" link MUST invoke the operating system's default file selection dialog.
- **FR-009**: When a file is selected via the file selection dialog, the system MUST upload the file directly to the directory currently being viewed.
- **FR-010**: Upon successful upload, the system MUST immediately update the displayed directory listing to show the new item.
- **FR-011**: Upon successful upload, the system MUST immediately increment the file count displayed in the bottom footer summary.
- **FR-012**: The system MUST NOT miscount the newly uploaded file as a folder; it MUST specifically increment the file count.
- **FR-013**: If the user cancels the file selection dialog, the system MUST NOT perform any upload or mutate view state.
- **FR-014**: If an upload fails due to exceeding the 8 MB size limit, the system MUST display a clear, accessible error message stating the 8 MB limit.
- **FR-015**: If an upload fails due to network or server error, the system MUST display an error banner and retain the current directory listing.
- **FR-016**: The upload action MUST be accessible via keyboard and standard screen readers.
- **FR-017**: The server endpoint MUST return metadata for the saved file upon success, including its final saved name and size.

---

### Key Entities

- **UploadRequest**: Represents an incoming file upload containing:
  - Destination relative folder path
  - File binary content stream
  - Original client filename
  - Content length (in bytes)
- **UploadResult**: Represents the outcome of an upload operation:
  - Final saved filename (reflecting `_copyN` postfix if collision occurred)
  - Relative file path in storage
  - File size in bytes
  - Success status and informative message
- **DirectoryItemSummary**: Aggregate counts of the active view:
  - `folderCount`: Total number of folders in view
  - `fileCount`: Total number of files in view (automatically incremented upon successful upload)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can trigger the system file selector with a single click on the upload link located above and to the right of the file listing.
- **SC-002**: 100% of files exceeding 8 MB (8,388,608 bytes) are prevented or rejected from saving to disk.
- **SC-003**: 100% of filename collisions result in non-destructive unique renaming (`_copy1`, `_copy2`, etc.) without loss of existing file content.
- **SC-004**: The file counter in the footer updates immediately upon upload completion without requiring a page reload.
- **SC-005**: 100% of path traversal attempts targeting upload locations outside the storage boundary are blocked.

---

## Assumptions

- Uploads occur one file at a time per user action (multi-file bulk upload is not required for this phase).
- Maximum allowed file size is fixed at 8 MB (8 * 1024 * 1024 = 8,388,608 bytes) across both client and server.
- The `_copyN` suffix is inserted immediately prior to the file extension (e.g. `test.png` becomes `test_copy1.png`). For extensionless files, the suffix is appended directly (`file` becomes `file_copy1`).
- The upload link is styled consistently with existing navigation/action controls and placed in the top right area of the file explorer view header.
- The upload mechanism uses standard HTML file input (`<input type="file">`) triggered programmatically to invoke the OS default file chooser.
