import { describe, it, expect } from 'vitest';
import { NavbarComponent } from '../src/components/navbar';
import { HeroCardComponent } from '../src/components/hero-card';

describe('UI Components', () => {
  it('renders NavbarComponent with active links', () => {
    const navbar = new NavbarComponent('/detail/item-1', [
      { path: '/', label: 'Home' },
      { path: '/detail/item-1', label: 'Item 1' },
    ]);

    const el = navbar.render();
    expect(el.tagName.toLowerCase()).toBe('nav');
    expect(el.className).toBe('navbar');

    const links = el.querySelectorAll('a');
    expect(links.length).toBe(2);
    expect(links[0].className).toBe('');
    expect(links[1].className).toBe('active');
  });

  it('renders HeroCardComponent with title, description, and badge', () => {
    const hero = new HeroCardComponent({
      title: 'Test Title',
      description: 'Test Description',
      badge: 'Test Badge',
    });

    const el = hero.render();
    expect(el.querySelector('h2')?.textContent).toContain('Test Title');
    expect(el.querySelector('.badge')?.textContent).toContain('[Test Badge]');
    expect(el.querySelector('p')?.textContent).toBe('Test Description');
  });
});
