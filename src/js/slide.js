import { attachStyle } from './utils.js';

customElements.define('p-slide', class extends HTMLElement {
  constructor() {
    super();
    let active;
    Object.defineProperty(this, 'active', {
      get() { return active; },
      set(value) {
        active = Boolean(value);
        this.setAttribute('aria-hidden', `${!active}`);
      }
    });
    this.active = false;
  }

  connectedCallback() {
    if (!this.root) {
      this.root = this.attachShadow({ mode: 'open' });
      this.root.innerHTML = '<slot></slot>'
      attachStyle('css/slide.css', this.root);
    }
  }

  next() {
    this.setAttribute('previous', '');
    this.active = false;
    return true;
  }
  previous() {
    this.removeAttribute('previous');
    this.active = false;
    return true;
  }
});
