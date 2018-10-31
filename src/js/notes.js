import { attachStyle, createRoot } from './utils.js';

customElements.define('p-notes', class extends HTMLElement {
  constructor() {
    super();
    createRoot(this, '');
    attachStyle('css/notes.css', this.root);
  }

  get isVisible() {
    const fragment = this.closest('p-fragment');
    return !fragment || fragment.isVisible;
  }
});
