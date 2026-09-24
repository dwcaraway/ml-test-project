# Tasks: SPA Views & Deep-Linking Routing

**Feature**: SPA Views & Deep-Linking Routing
**Feature Directory**: `specs/001-spa-views-routing`
**Input Documents**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md), [contracts/router.contract.ts](contracts/router.contract.ts), [contracts/spa-fallback.contract.md](contracts/spa-fallback.contract.md), [research.md](research.md), [quickstart.md](quickstart.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, directory structure, shared contracts, and server-side fallback configuration.

- [ ] T001 Create frontend directory layout for `frontend/src/core/`, `frontend/src/components/`, and `frontend/src/views/`
- [ ] T002 [P] Define core router and view TypeScript contracts in `frontend/src/core/types.ts` per `specs/001-spa-views-routing/contracts/router.contract.ts`
- [ ] T003 [P] Configure ASP.NET Core SPA fallback routing using `app.MapFallbackToFile("index.html")` in `backend/Program.cs` per `specs/001-spa-views-routing/contracts/spa-fallback.contract.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Foundational routing engine, base lifecycle abstractions, and backend fallback test that MUST be completed before user stories.

**⚠️ CRITICAL**: No user story work can begin until this foundational phase is complete.

- [ ] T004 [P] Implement backend integration test in `backend/TestProject.Tests/Integration/SpaFallbackTests.cs` to verify fallback routing serves `index.html` for client paths (e.g. `/detail/123`) and preserves API route `/test`
- [ ] T005 [P] Implement base component and view lifecycle abstractions with `AbortController` event listener cleanup in `frontend/src/core/view.ts` and `frontend/src/core/component.ts`
- [ ] T006 Implement native HTML5 History API `Router` class in `frontend/src/core/router.ts` supporting path regex matching, parameter extraction (`:([a-zA-Z0-9_]+)`), route registration, and history event handling (`pushState`, `replaceState`, `popstate`)
- [ ] T007 [P] Write unit tests for `Router` route registration, parameter extraction, and fallback resolution in `frontend/tests/router.test.ts`

**Checkpoint**: Foundation ready — router engine and base contracts verified. User story implementation can begin.

---

## Phase 3: User Story 1 - Direct URL Navigation & Deep-Linking (Priority: P1) 🎯 MVP

**Goal**: Allow users to access specific views directly via URL or deep links (e.g., `/`, `/detail/:id`) and render the target view or fallback Not Found view without full page reloads.

**Independent Test**: Directly load or navigate to `/`, `/detail/test-42`, and `/unrecognized`, verifying that the router resolves the correct view with parameters and renders the Fallback view on unmatched paths.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T008 [P] [US1] Write unit and integration tests in `frontend/tests/deep-linking.test.ts` verifying direct URL navigation to `/`, `/detail/:id` with parameter extraction, and 404 fallback routing

### Implementation for User Story 1

- [ ] T009 [P] [US1] Implement `NotFoundView` in `frontend/src/views/not-found-view.ts` conforming to `IView` to display a 404 message and a recovery link navigating to `/`
- [ ] T010 [P] [US1] Implement baseline `HomeView` in `frontend/src/views/home-view.ts` and `DetailView` in `frontend/src/views/detail-view.ts` displaying extracted route parameters (`id`)
- [ ] T011 [US1] Wire application bootstrap in `frontend/src/main.ts` and `frontend/index.html` to register routes (`/`, `/detail/:id`), set `NotFoundView`, bind container element `#app`, and start the router

**Checkpoint**: User Story 1 functional and independently testable as the core MVP. Direct deep-linking and 404 handling verified.

---

## Phase 4: User Story 2 - View Navigation & History Synchronization (Priority: P2)

**Goal**: Enable smooth in-app navigation between views without full page reloads, updating the browser address bar and enabling native browser Back/Forward navigation.

**Independent Test**: Trigger client navigation from Home View to Detail View, verify URL update without page reload, press browser Back button, and verify Home View re-mounts.

### Tests for User Story 2

- [ ] T012 [P] [US2] Write unit tests in `frontend/tests/history-navigation.test.ts` verifying programmatic and link-based view navigation, history stack updates via `pushState`, and `popstate` Back/Forward traversal

### Implementation for User Story 2

- [ ] T013 [P] [US2] Implement global internal link click interceptor in `frontend/src/core/router.ts` to intercept `<a>` navigation events with matching origins and route via `router.navigate()`
- [ ] T014 [US2] Update `HomeView` in `frontend/src/views/home-view.ts` with navigation links to sample detail pages (`/detail/item-1`, `/detail/item-2`), and update `DetailView` in `frontend/src/views/detail-view.ts` with a "Back to Home" navigation action

**Checkpoint**: User Stories 1 and 2 work independently and together. Seamless in-app navigation and browser history traversal verified.

---

## Phase 5: User Story 3 - View Composition with Component Collections (Priority: P3)

**Goal**: Structure views as cohesive orchestration containers managing collections of focused visual components (such as navbar, hero card, detail inspector) with clean mount/unmount lifecycles and event detachment.

**Independent Test**: Mount and unmount multi-component views, verifying all child components render within the layout and detach event listeners cleanly without memory leaks.

### Tests for User Story 3

- [ ] T015 [P] [US3] Write unit tests in `frontend/tests/view-lifecycle.test.ts` verifying view composition, child component mounting, unmounting, and `destroy()` / `AbortController` event listener cleanup

### Implementation for User Story 3

- [ ] T016 [P] [US3] Implement reusable `NavbarComponent` in `frontend/src/components/navbar.ts` supporting navigation links and active route highlighting
- [ ] T017 [P] [US3] Implement `HeroCardComponent` in `frontend/src/components/hero-card.ts` for structured content presentation
- [ ] T018 [US3] Integrate `NavbarComponent` and `HeroCardComponent` into `HomeView` (`frontend/src/views/home-view.ts`) and `DetailView` (`frontend/src/views/detail-view.ts`), ensuring complete component lifecycle and cleanup

**Checkpoint**: All user stories fully implemented. Component composition and leak-free lifecycle management verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification, linting, formatting, documentation, and end-to-end quickstart execution.

- [ ] T019 [P] Verify TypeScript compilation and linting pass with zero errors/warnings via `npm run typecheck` in `frontend/`
- [ ] T020 [P] Run full test suites via `npm test` in `frontend/` and `dotnet test` in `backend/` to ensure zero regressions across both layers
- [ ] T021 Execute full validation workflow following `specs/001-spa-views-routing/quickstart.md` across dev server and production build
- [ ] T022 [P] Update project documentation and architecture notes in `README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories.
- **User Stories (Phases 3–5)**: All depend on Foundational phase completion.
  - Can proceed sequentially in priority order (P1 → P2 → P3) or in parallel.
- **Polish (Phase 6)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start immediately after Foundational (Phase 2). Delivers standalone MVP.
- **User Story 2 (P2)**: Depends on Foundational (Phase 2). Extends router navigation and view links built in US1.
- **User Story 3 (P3)**: Depends on Foundational (Phase 2). Refactors views from US1/US2 into multi-component composite views.

---

## Parallel Opportunities

### Parallel Setup & Foundation
```bash
# Launch Phase 1 parallel tasks:
Task T002: "Define core router and view TypeScript contracts in frontend/src/core/types.ts"
Task T003: "Configure ASP.NET Core SPA fallback routing using app.MapFallbackToFile in backend/Program.cs"

# Launch Phase 2 parallel tasks:
Task T004: "Implement backend integration test in backend/TestProject.Tests/Integration/SpaFallbackTests.cs"
Task T005: "Implement base component and view lifecycle abstractions in frontend/src/core/view.ts"
Task T007: "Write unit tests for Router in frontend/tests/router.test.ts"
```

### Parallel User Story 1 Implementation
```bash
Task T008: "Write unit and integration tests in frontend/tests/deep-linking.test.ts"
Task T009: "Implement NotFoundView in frontend/src/views/not-found-view.ts"
Task T010: "Implement baseline HomeView and DetailView in frontend/src/views/"
```

### Parallel User Story 3 Components
```bash
Task T016: "Implement reusable NavbarComponent in frontend/src/components/navbar.ts"
Task T017: "Implement HeroCardComponent in frontend/src/components/hero-card.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup (`T001`–`T003`)
2. Complete Phase 2: Foundational (`T004`–`T007`)
3. Complete Phase 3: User Story 1 (`T008`–`T011`)
4. **STOP and VALIDATE**: Verify direct deep-linking, parameter extraction, and 404 fallback independently. Deploy/demonstrate MVP.

### Incremental Delivery
1. Foundation Ready (`T001`–`T007`) → Core routing and fallback proven.
2. User Story 1 (`T008`–`T011`) → Direct deep-linking and fallback routing works (MVP!).
3. User Story 2 (`T012`–`T014`) → In-app link navigation and Back/Forward history traversal works.
4. User Story 3 (`T015`–`T018`) → Full component composition and leak-free lifecycle cleanup works.
5. Polish (`T019`–`T022`) → End-to-end validation, linting, typechecks, and tests verified.
