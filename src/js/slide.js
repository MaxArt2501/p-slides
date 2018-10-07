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

  get isPrevious() {
    return this.getAttribute('previous') !== null;
  }
  set isPrevious(isPrevious) {
    if (!!isPrevious) {
      this.setAttribute('previous', '');
    } else {
      this.removeAttribute('previous');
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
    this.isPrevious = true;
    this.active = false;
    return true;
  }
  previous() {
    const visibleFragment = this.lastVisibleFragment;
    if (visibleFragment) {
      visibleFragment.setAttribute('aria-hidden', 'true');
      return false;
    }
    this.isPrevious = false;
    this.active = false;
    return true;
  }

  setFragmentVisibility(visible) {
    for (const fragment of this.fragments) {
      fragment.setAttribute('aria-hidden', !visible);
    }
  }
});
