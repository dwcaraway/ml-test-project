# Data Model & Entity Specifications: SPA Views & Routing

## Core Entities

### 1. `RouteDefinition`
Defines a registered route mapping a path pattern to a specific view factory.

- **Attributes**:
  - `path`: `string` — Path pattern matching the route (e.g., `'/'`, `'/detail/:id'`). Must start with `'/'`.
  - `viewFactory`: `() => IView` — Factory function instantiating the view instance.
  - `title`: `string` (optional) — Document title to display in the browser tab upon activation.
  - `regex`: `RegExp` (internal) — Compiled regular expression for path matching.
  - `paramKeys`: `string[]` (internal) — Ordered list of extracted route parameter names (e.g., `['id']`).

- **Validation Rules**:
  - Must begin with a leading `/`.
  - Parameter tokens must follow the alphanumeric format `:([a-zA-Z0-9_]+)`.
  - No duplicate path definitions within the same router instance.

---

### 2. `RouteMatch`
Represents the outcome of resolving a given URL pathname against registered `RouteDefinition` entries.

- **Attributes**:
  - `route`: `RouteDefinition` — The matched route specification.
  - `params`: `Record<string, string>` — Extracted dynamic parameters mapped by key.
  - `path`: `string` — The actual requested pathname (e.g., `'/detail/42'`).

- **Validation Rules**:
  - Unmatched paths resolve to a fallback `RouteMatch` pointing to `NotFoundView` with empty params.

---

### 3. `IComponent`
Defines the uniform structural contract for reusable UI building blocks displayed within views.

- **Methods**:
  - `render(): HTMLElement` — Creates and returns the component's root DOM element with its content and internal event listeners wired.
  - `destroy?(): void` — Optional teardown hook for releasing timers, global event listeners, or cached DOM references.

- **Invariants**:
  - A component must render self-contained markup using standard DOM elements.
  - No external UI library dependencies or framework runtime hooks.

---

### 4. `IView`
Represents a distinct high-level application page/workflow containing a layout and a collection of components.

- **Attributes**:
  - `name`: `string` — Human-readable view identifier (e.g., `'HomeView'`, `'DetailView'`, `'NotFoundView'`).

- **Methods**:
  - `mount(container: HTMLElement, params: Record<string, string>): void` — Mounts the view and its constituent components into the provided DOM container, binding route parameters.
  - `unmount(): void` — Dismantles the view, invokes `destroy()` on all child components, aborts pending operations, and detaches event listeners.

- **Invariants**:
  - Must clean up all event listeners and child components during `unmount()`.
  - Must not mutate the container outside its allocated mount lifecycle.

---

### 5. `NavigationOptions`
Configuration options provided when programmatically requesting navigation.

- **Attributes**:
  - `replace`: `boolean` (optional, default `false`) — When `true`, uses `history.replaceState` instead of `history.pushState` to overwrite the current history entry without pushing a new one.

---

## State Transitions & Lifecycles

### Router State Machine

```
 [Initial URL] ───► [Match Route] ──┬──► (Match Found) ──► [Mount Target View] ──► [Active View]
                                   │
                                   └──► (No Match)    ──► [Mount NotFoundView] ──► [Active View]

 [Navigation Action] ──► [Push/Replace State] ──► [Unmount Current View] ──► [Mount New View]
```

### View Lifecycle Transitions

```
+---------------+        mount(container, params)        +---------------+
|   UNMOUNTED   |  ───────────────────────────────────►  |    MOUNTED    |
+---------------+                                        +---------------+
        ▲                                                        │
        │                       unmount()                        │
        └────────────────────────────────────────────────────────┘
```

1. **Instantiation**: The `viewFactory` creates a fresh `IView` instance.
2. **Mounting**: The router calls `view.mount(container, params)`. The view instantiates its constituent `IComponent` instances, calls `component.render()`, appends them to its layout, and attaches listeners using an `AbortController`.
3. **Active**: The view responds to user interactions and coordinates updates across its components.
4. **Unmounting**: When navigation occurs, the router invokes `view.unmount()`. The view aborts its `AbortController`, calls `destroy()` on each child component, and clears the container element.
