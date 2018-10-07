import { attachStyle } from './utils.js';

customElements.define('p-fragment', class extends HTMLElement {
  constructor() {
    super();
    this.setAttribute('aria-hidden', 'true');
  }

  connectedCallback() {
    if (!this.root) {
      this.root = this.attachShadow({ mode: 'open' });
      this.root.innerHTML = '<slot></slot>'
      attachStyle('css/fragment.css', this.root);
    }
  }

  get index() {
    return +this.getAttribute('index') || 0;
  }
  set index(index = 0) {
    const attrIndex = +index || 0;
    if (attrIndex) {
      this.setAttribute('index', attrIndex);
    } else {
      this.removeAttribute('index');
    }
  }
});
