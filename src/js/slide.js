import { attachStyle } from './utils.js';

customElements.define('p-slide', class extends HTMLElement {
  constructor() {
    super();
    this.isActive = false;
  }

  connectedCallback() {
    if (!this.root) {
      this.root = this.attachShadow({ mode: 'open' });
      this.root.innerHTML = '<slot></slot>'
      attachStyle('css/slide.css', this.root);
    }
  }

  get deck() {
    return this.closest('p-deck');
  }

  get isActive() {
    return this.getAttribute('active') !== null;
  }
  set isActive(isActive) {
    this.setAttribute('aria-hidden', `${!isActive}`);
    if (!!isActive) {
      this.setAttribute('active', '');
    } else {
      this.removeAttribute('active');
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

  get isCurrent() {
    return this.deck.currentSlide === this;
  }
  set isCurrent(isCurrent) {
    if (!isCurrent) {
      this.isActive = false;
    } else {
      this.deck.currentSlide = this;
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
    this.isActive = false;
    return true;
  }
  previous() {
    const visibleFragment = this.lastVisibleFragment;
    if (visibleFragment) {
      visibleFragment.setAttribute('aria-hidden', 'true');
      return false;
    }
    this.isPrevious = false;
    this.isActive = false;
    return true;
  }

  setFragmentVisibility(visible) {
    for (const fragment of this.fragments) {
      fragment.setAttribute('aria-hidden', !visible);
    }
  }
});
