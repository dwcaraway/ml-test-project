import { IComponent, IView } from './types';

/**
 * Base abstract class for views that host and orchestrate components.
 */
export abstract class BaseView implements IView {
  abstract readonly name: string;

  protected container: HTMLElement | null = null;
  protected params: Record<string, string> = {};
  protected components: IComponent[] = [];
  protected abortController: AbortController = new AbortController();

  mount(container: HTMLElement, params: Record<string, string>): void {
    this.container = container;
    this.params = params;
    this.abortController = new AbortController();
    this.components = [];

    this.container.innerHTML = '';
    this.onMount();
  }

  /**
   * Hook for view implementations to render layout and register child components.
   */
  protected abstract onMount(): void;

  /**
   * Registers a child component, ensuring it will be destroyed when this view unmounts.
   */
  protected registerComponent<T extends IComponent>(component: T): T {
    this.components.push(component);
    return component;
  }

  /**
   * Adds an event listener tied to the view's active lifecycle.
   */
  protected addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement | Window | Document,
    type: K,
    listener: (this: HTMLElement | Window | Document, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void {
    const opts: AddEventListenerOptions =
      typeof options === 'object'
        ? { ...options, signal: this.abortController.signal }
        : { capture: options, signal: this.abortController.signal };

    element.addEventListener(type, listener as EventListener, opts);
  }

  unmount(): void {
    // Abort all listeners attached via this view's signal
    this.abortController.abort();

    // Destroy all registered child components
    for (const component of this.components) {
      if (typeof component.destroy === 'function') {
        component.destroy();
      }
    }
    this.components = [];

    this.onUnmount();

    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }

  /**
   * Optional hook for subclass-specific unmount actions.
   */
  protected onUnmount(): void {
    // Override in subclasses if necessary
  }
}
