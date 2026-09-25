# Feature Specification: Frontend File Explorer View & Breadcrumb Navigation

**Feature Branch**: `003-file-explorer-view`

**Created**: 2026-09-24

**Status**: Ready for Planning

**Input**: User description: "Create a file explorer view in the frontend single page application. This view queries the backend api and displays the name and size of each result. If the result is a file, display a download link beside it to download the file. If a user clicks on a folder, change the current path to that folder and display the folders and files within (browse). Display a Breadcrumb at the top when the current working directory is not the root folder. when the user is more than 3 levels below the root folder, display (root folder name) > ... > (current folder name). When users click on the breadcrumbs this changes the current working directory."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Files & Folders with Size Details (Priority: P1)

A user visits the File Explorer in the single-page application to view available files and directories stored on the server. The application requests the listing from the backend API and presents each item with its name and size. Folders display `"-"` for size, while files display their size.

**Why this priority**: Core value of the feature. Without the ability to view items and distinguish files from folders with schema-compliant sizes, no subsequent navigation or downloading is possible.

**Independent Test**: Navigate to the File Explorer view at the root directory; verify that all server items are rendered showing item names, `"-"` for folders, and byte counts for files.

**Acceptance Scenarios**:

1. **Given** the user navigates to the File Explorer view at root, **When** the page loads, **Then** the view queries the backend API and renders a table or list containing the names and sizes of all items in the root folder.
2. **Given** the listing includes both folders and files, **When** the items are displayed, **Then** every folder row displays `"-"` in the size column, and every file row displays its file size.
3. **Given** the backend API returns an empty directory, **When** the view loads, **Then** a friendly "No files or folders found" empty-state message is displayed.

---

### User Story 2 - Folder Navigation & Dynamic Breadcrumbs (Priority: P2)

A user navigates into subdirectories by clicking on folder items. The application updates the current path, fetches the subfolder's contents from the API, and displays an interactive breadcrumb trail at the top of the view. The user can click any segment in the breadcrumb to immediately navigate back up the hierarchy. When the directory depth exceeds 3 levels below root, the breadcrumbs collapse to `(root folder name) > ... > (current folder name)`.

**Why this priority**: High-value exploration capability. Allows users to move through deeply nested folder hierarchies and maintain situational awareness of their current location with quick navigation.

**Independent Test**: Click a folder in the listing; verify the view updates to show that folder's contents and displays a breadcrumb at the top. Click a breadcrumb segment and verify the view navigates back to that parent folder.

**Acceptance Scenarios**:

1. **Given** the user is viewing a directory containing a folder named "documents", **When** the user clicks on "documents", **Then** the current working directory changes to "documents", the contents of "documents" are fetched and displayed, and a breadcrumb appears at the top.
2. **Given** the user is viewing the root directory, **When** the view is rendered, **Then** no breadcrumb is displayed (or only the root indicator is shown).
3. **Given** the user is 1, 2, or 3 levels below the root (e.g., `Root > docs > 2026`), **When** viewing the breadcrumbs, **Then** each individual path segment is displayed and clickable.
4. **Given** the user is more than 3 levels below root (e.g., `Root > docs > finance > 2026 > q1`), **When** viewing the breadcrumbs, **Then** the breadcrumb displays `(root folder name) > ... > (current folder name)`.
5. **Given** the user is viewing a nested directory, **When** the user clicks any clickable segment in the breadcrumb, **Then** the current working directory updates to that selected ancestor and re-renders its contents.

---

### User Story 3 - File Download Link (Priority: P3)

When an item in the directory listing is a file, the user sees a download link or button adjacent to the file name. Clicking the link triggers the browser's download mechanism to retrieve the file from the server's streaming download endpoint.

**Why this priority**: Completes the end-to-end workflow by allowing users to extract content discovered during browsing.

**Independent Test**: Locate a file in the directory listing; click the download link beside it; verify that the browser initiates a download request targeting `/api/download?path={filePath}`.

**Acceptance Scenarios**:

1. **Given** a directory listing containing a file (e.g., `manual.pdf`), **When** the listing is rendered, **Then** a download link is displayed beside the file item.
2. **Given** a directory listing containing a folder, **When** the listing is rendered, **Then** no download link is displayed for that folder row.
3. **Given** the user clicks the download link for a file, **When** the request is initiated, **Then** the browser downloads the file directly from the backend API.

---

### Edge Cases

- **Nonexistent or Deleted Directory**: If the user navigates directly to a path that does not exist or was deleted on the server, the view displays a clear "Directory not found" error notification with a link or button to return to the root folder.
- **Network / API Failure**: If the backend API cannot be reached or returns a 500 error, an accessible error banner informs the user and provides a "Retry" button.
- **Special Characters in Folder Names**: Folders and files with spaces, hyphens, and URL-sensitive characters are properly encoded and decoded when querying the API and generating download links.
- **Deep Navigation Beyond 3 Levels**: When navigating back from a truncated path (e.g. clicking root from a 5-level deep folder), the breadcrumb accurately resets to the root view.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated File Explorer view in the frontend single-page application.
- **FR-002**: System MUST query the backend API (`/api/browse`) to fetch file and directory listings for the current working directory.
- **FR-003**: System MUST display the name and size of each file and folder in the current directory.
- **FR-004**: System MUST display `"-"` as the size for all folder items.
- **FR-005**: System MUST display the non-negative byte count or formatted size for all file items.
- **FR-006**: System MUST display an accessible download link beside each file item targeting `/api/download?path={filePath}`.
- **FR-007**: System MUST NOT display a download link for folder items.
- **FR-008**: System MUST display the root folder name in the breadcrumb as `"Home"`.
- **FR-009**: When the user is more than 3 levels below the root folder, the system MUST display `Home > ... > (current folder name)` by default, and clicking on `...` MUST expand the breadcrumb inline to reveal all intermediate path segments.
- **FR-010**: System MUST maintain the current folder path and browser navigation/deep-linking via URL query parameters (e.g. `/files?path=docs/reports`), integrating with browser history so Back and Forward buttons navigate through folder history.
- **FR-011**: System MUST hide the breadcrumb trail when the current working directory is the root folder.
- **FR-012**: When a user clicks on an ancestor breadcrumb item, the system MUST change the current working directory to that ancestor and refresh the listing.
- **FR-013**: When a user clicks on a folder row in the file listing, the system MUST navigate into that folder and refresh the listing.
- **FR-014**: System MUST display a loading indicator while awaiting API responses.
- **FR-015**: System MUST display a user-friendly error message if directory fetching fails (e.g. 404 or network error) with an option to navigate back to the root.

---

### Key Entities

- **FileSystemItem**: Represents a file or folder returned by the browse API, containing:
  - `name`: string name of the item
  - `size`: string representation of the size (`"-"` for folders, byte count for files)
  - `type`: classification (`"folder"` or `"file"`)
- **BreadcrumbSegment**: Represents an individual node in the breadcrumb trail:
  - `name`: display label (e.g. root name, folder name, or `...`)
  - `path`: relative path associated with this segment
  - `isCurrent`: boolean indicating whether this segment is the current active folder
  - `isClickable`: boolean indicating whether clicking this segment triggers navigation

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view the root directory listing within 1 second of loading the File Explorer view on standard broadband.
- **SC-002**: 100% of folder items clearly indicate `size: "-"` and 100% of file items display their file size.
- **SC-003**: 100% of file items provide a functioning one-click download link that downloads the file without errors.
- **SC-004**: Users can navigate into subfolders and back to any ancestor via breadcrumbs in under 2 clicks.
- **SC-005**: Directory paths deeper than 3 levels collapse to `(root folder name) > ... > (current folder name)` with 100% reliability.
- **SC-006**: Users can use browser Back and Forward buttons to navigate between previously viewed directories without broken state.

---

## Assumptions

- The backend Web API from feature `002-file-browser-api` is available at `/api/browse` and `/api/download`.
- The frontend single-page application is built in vanilla TypeScript using the existing router and view architecture from feature `001-spa-views-routing`.
- File downloads are handled natively by the browser via standard HTTP download headers (`Content-Disposition: attachment`).
- Pagination from the browse API can use default `pageSize: 100` or display items returned in the response.
