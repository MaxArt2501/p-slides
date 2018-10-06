import { attachStyle } from './utils.js';

customElements.define('p-notes', class extends HTMLElement {
  connectedCallback() {
    if (!this.root) {
      this.root = this.attachShadow({ mode: 'open' });
      this.root.innerHTML = '<slot></slot>';
      attachStyle('css/notes.css', this.root);
    }
  }
});
