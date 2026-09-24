import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BaseComponent } from '../src/core/component';
import { BaseView } from '../src/core/view';

class MockChildComponent extends BaseComponent {
  destroyCalled = false;
  clickCount = 0;

  render(): HTMLElement {
    const el = document.createElement('button');
    el.id = 'child-btn';
    el.textContent = 'Click me';

    this.addEventListener(el, 'click', () => {
      this.clickCount++;
    });

    return el;
  }

  protected override onDestroy(): void {
    this.destroyCalled = true;
  }
}

class CompositeTestView extends BaseView {
  readonly name = 'CompositeTestView';
  childComponent: MockChildComponent | null = null;
  windowEventFired = 0;

  protected onMount(): void {
    if (!this.container) return;

    this.childComponent = this.registerComponent(new MockChildComponent());
    this.container.appendChild(this.childComponent.render());

    // Register a window listener to verify AbortController cleanup
    this.addEventListener(window, 'custom-event' as any, () => {
      this.windowEventFired++;
    });
  }
}

describe('User Story 3 - View Composition & Lifecycle', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('renders child components inside composite view', () => {
    const view = new CompositeTestView();
    view.mount(container, {});

    const btn = container.querySelector('#child-btn') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe('Click me');

    btn.click();
    expect(view.childComponent?.clickCount).toBe(1);
  });

  it('invokes destroy on all child components when view unmounts', () => {
    const view = new CompositeTestView();
    view.mount(container, {});

    const child = view.childComponent;
    expect(child?.destroyCalled).toBe(false);

    view.unmount();

    expect(child?.destroyCalled).toBe(true);
    expect(container.innerHTML).toBe('');
  });

  it('cleans up window and element event listeners via AbortController on unmount', () => {
    const view = new CompositeTestView();
    view.mount(container, {});

    // Dispatch custom event before unmount
    window.dispatchEvent(new Event('custom-event'));
    expect(view.windowEventFired).toBe(1);

    view.unmount();

    // Dispatch custom event after unmount — listener should have been aborted!
    window.dispatchEvent(new Event('custom-event'));
    expect(view.windowEventFired).toBe(1); // Still 1, didn't fire again!
  });
});
