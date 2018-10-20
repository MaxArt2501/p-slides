import { attachStyle, createRoot } from './utils.js';

customElements.define('p-notes', class extends HTMLElement {
  constructor() {
    super();
    createRoot(this, '<slot></slot>');
    attachStyle('css/notes.css', this.root);
  }
});
