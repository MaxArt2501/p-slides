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

  get fragments() {
    return [ ...this.querySelectorAll('p-fragment') ].sort((f1, f2) => {
      // There *should* be some handling in case of non-stable sort, but it has been fixed in Chrome too
      return f1.index - f2.index;
    });
  }
  get nextHiddenFragment() {
    return this.fragments.find(fragment => fragment.getAttribute('aria-hidden') === 'true');
  }
  get lastVisibleFragment() {
    return this.fragments.reverse().find(fragment => fragment.getAttribute('aria-hidden') === 'false');
  }

  next() {
    const hiddenFragment = this.nextHiddenFragment;
    if (hiddenFragment) {
      hiddenFragment.setAttribute('aria-hidden', 'false');
      return false;
    }
    this.setAttribute('previous', '');
    this.active = false;
    return true;
  }
  previous() {
    const visibleFragment = this.lastVisibleFragment;
    if (visibleFragment) {
      visibleFragment.setAttribute('aria-hidden', 'true');
      return false;
    }
    this.removeAttribute('previous');
    this.active = false;
    return true;
  }
});
