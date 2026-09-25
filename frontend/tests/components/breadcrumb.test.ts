import { describe, it, expect, vi } from 'vitest';
import { BreadcrumbComponent } from '../../src/components/breadcrumb';

describe('BreadcrumbComponent', () => {
  it('hides or renders empty breadcrumb when path is root ("")', () => {
    const component = new BreadcrumbComponent('', vi.fn());
    const el = component.render();

    expect(el.children.length === 0 || el.classList.contains('hidden') || el.style.display === 'none').toBe(true);
  });

  it('renders root label Home and single level segment for depth 1', () => {
    const onNavigate = vi.fn();
    const component = new BreadcrumbComponent('documents', onNavigate);
    const el = component.render();

    expect(el.getAttribute('aria-label')).toBe('Breadcrumb');
    const items = el.querySelectorAll('.breadcrumb-item');
    expect(items.length).toBe(2);

    // Home link
    const homeLink = items[0].querySelector('a');
    expect(homeLink?.textContent).toBe('Home');
    expect(homeLink?.getAttribute('href')).toBe('/files');

    // Current folder
    expect(items[1].classList.contains('active')).toBe(true);
    expect(items[1].textContent).toBe('documents');
    expect(items[1].getAttribute('aria-current')).toBe('page');

    homeLink?.click();
    expect(onNavigate).toHaveBeenCalledWith('');
  });

  it('renders all segments when depth is <= 3 (e.g. depth 3)', () => {
    const onNavigate = vi.fn();
    const component = new BreadcrumbComponent('a/b/c', onNavigate);
    const el = component.render();

    const items = el.querySelectorAll('.breadcrumb-item');
    // Home + a + b + c = 4 items
    expect(items.length).toBe(4);
    expect(items[0].textContent).toBe('Home');
    expect(items[1].textContent).toBe('a');
    expect(items[2].textContent).toBe('b');
    expect(items[3].textContent).toBe('c');
    expect(items[3].classList.contains('active')).toBe(true);

    // Click segment 'b'
    const linkB = items[2].querySelector('a');
    linkB?.click();
    expect(onNavigate).toHaveBeenCalledWith('a/b');
  });

  it('collapses intermediate levels when depth > 3 (e.g. depth 4)', () => {
    const component = new BreadcrumbComponent('a/b/c/d', vi.fn());
    const el = component.render();

    const items = el.querySelectorAll('.breadcrumb-item');
    // Home + ... + d = 3 items
    expect(items.length).toBe(3);
    expect(items[0].textContent).toBe('Home');
    const ellipsisBtn = items[1].querySelector('.breadcrumb-ellipsis') as HTMLButtonElement;
    expect(ellipsisBtn).not.toBeNull();
    expect(ellipsisBtn.textContent).toBe('...');
    expect(items[2].textContent).toBe('d');
    expect(items[2].classList.contains('active')).toBe(true);
  });

  it('expands intermediate levels inline when clicking ellipsis (...) button', () => {
    const onNavigate = vi.fn();
    const component = new BreadcrumbComponent('level1/level2/level3/level4', onNavigate);
    const el = component.render();

    let items = el.querySelectorAll('.breadcrumb-item');
    expect(items.length).toBe(3); // Home > ... > level4

    const ellipsisBtn = el.querySelector('.breadcrumb-ellipsis') as HTMLButtonElement;
    expect(ellipsisBtn).not.toBeNull();
    ellipsisBtn.click();

    // After click, should be expanded inline
    items = el.querySelectorAll('.breadcrumb-item');
    expect(items.length).toBe(5); // Home > level1 > level2 > level3 > level4
    expect(items[0].textContent).toBe('Home');
    expect(items[1].textContent).toBe('level1');
    expect(items[2].textContent).toBe('level2');
    expect(items[3].textContent).toBe('level3');
    expect(items[4].textContent).toBe('level4');

    // Click newly revealed intermediate segment level2
    const linkLevel2 = items[2].querySelector('a');
    linkLevel2?.click();
    expect(onNavigate).toHaveBeenCalledWith('level1/level2');
  });
});
