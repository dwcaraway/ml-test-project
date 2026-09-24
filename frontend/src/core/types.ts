/**
 * Core Router and View Types & Contracts
 * Feature: 001-spa-views-routing
 */

export interface IComponent {
  /**
   * Renders and returns the root DOM element for this component.
   */
  render(): HTMLElement;

  /**
   * Optional cleanup hook invoked when the parent view unmounts.
   */
  destroy?(): void;
}

export interface IView {
  /**
   * Human-readable identifier for debugging and telemetry.
   */
  readonly name: string;

  /**
   * Mounts the view and its child components into the specified container element.
   * @param container Target DOM element
   * @param params Extracted path parameters from the active route
   */
  mount(container: HTMLElement, params: Record<string, string>): void;

  /**
   * Unmounts the view, detaching event listeners and destroying child components.
   */
  unmount(): void;
}

export interface NavigationOptions {
  /**
   * If true, replaces the current history entry rather than pushing a new one.
   * Default: false.
   */
  replace?: boolean;
}

export interface RouteDefinition {
  /**
   * Path pattern (e.g., '/', '/detail/:id').
   */
  path: string;

  /**
   * Factory function instantiating the view.
   */
  viewFactory: () => IView;

  /**
   * Optional browser document title for this route.
   */
  title?: string;
}

export interface RouteMatch {
  /**
   * Matched route definition.
   */
  route: RouteDefinition;

  /**
   * Extracted parameters from the matched path.
   */
  params: Record<string, string>;

  /**
   * Raw matched pathname.
   */
  path: string;
}

export interface IRouter {
  /**
   * Registers a route definition with the router.
   */
  register(route: RouteDefinition): IRouter;

  /**
   * Registers the fallback view used when no route matches.
   */
  setNotFoundView(viewFactory: () => IView): IRouter;

  /**
   * Programmatically navigates to a new pathname.
   * @param path Target pathname (e.g., '/detail/123')
   * @param options Navigation options (e.g., { replace: true })
   */
  navigate(path: string, options?: NavigationOptions): void;

  /**
   * Starts listening to browser popstate events and renders the initial route.
   */
  start(): void;

  /**
   * Stops listening to events and unmounts the active view.
   */
  stop(): void;

  /**
   * Returns the currently active route match, if any.
   */
  getCurrentRoute(): RouteMatch | null;
}
