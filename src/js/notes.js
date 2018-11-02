import { createRoot } from './utils.js';

customElements.define('p-notes', class extends HTMLElement {
  constructor() {
    super();
    createRoot(this, '');
  }

  get isVisible() {
    const fragment = this.closest('p-fragment');
    return !fragment || fragment.isVisible;
  }
});
