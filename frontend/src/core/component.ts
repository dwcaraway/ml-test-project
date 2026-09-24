import { IComponent } from './types';

/**
 * Base abstract class for reusable UI components.
 */
export abstract class BaseComponent implements IComponent {
  protected abortController: AbortController = new AbortController();

  abstract render(): HTMLElement;

  /**
   * Helper to attach event listeners that automatically clean up when destroy() is invoked.
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

  destroy(): void {
    this.abortController.abort();
    this.onDestroy();
  }

  /**
   * Optional lifecycle hook for subclass-specific teardown.
   */
  protected onDestroy(): void {
    // Override in subclasses if additional cleanup is required
  }
}
