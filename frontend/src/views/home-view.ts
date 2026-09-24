import { BaseView } from '../core/view';
import { NavbarComponent } from '../components/navbar';
import { HeroCardComponent } from '../components/hero-card';

export class HomeView extends BaseView {
  readonly name = 'HomeView';

  protected onMount(): void {
    if (!this.container) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'home-view';

    // 1. Navigation Bar Component
    const navbar = this.registerComponent(new NavbarComponent('/'));
    wrapper.appendChild(navbar.render());

    // 2. Hero Card Component
    const heroCard = this.registerComponent(
      new HeroCardComponent({
        title: 'SPA Views & Deep-Linking',
        description:
          'Single Page Application featuring pure vanilla TypeScript, native HTML5 History API routing, and component-based views.',
        badge: 'Vanilla TS',
      })
    );
    wrapper.appendChild(heroCard.render());

    // 3. Item List Section
    const itemsSection = document.createElement('section');
    itemsSection.className = 'items-section';
    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = 'Explore Resources via Deep Links:';
    itemsSection.appendChild(sectionTitle);

    const list = document.createElement('ul');
    list.className = 'item-list';

    const items = [
      { id: 'item-1', name: 'Document Alpha' },
      { id: 'item-2', name: 'Folder Beta' },
      { id: 'demo-42', name: 'Resource 42' },
    ];

    for (const item of items) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `/detail/${item.id}`;
      a.className = 'item-link';
      a.textContent = `${item.name} (/detail/${item.id})`;
      li.appendChild(a);
      list.appendChild(li);
    }

    itemsSection.appendChild(list);
    wrapper.appendChild(itemsSection);

    this.container.appendChild(wrapper);
  }
}
