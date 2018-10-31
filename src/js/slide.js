import { attachStyle, createRoot, fireEvent } from './utils.js';

customElements.define('p-slide', class extends HTMLElement {
  constructor() {
    super();
    this.isActive = false;
    createRoot(this, '<slot></slot>');
    attachStyle('css/slide.css', this.root);
  }

  static get observedAttributes() {
    return [ 'active', 'full-view' ];
  }

  attributeChangedCallback(attribute, _, value) {
    if (attribute === 'active') {
      const isActive = value !== null;
      this.setAttribute('aria-hidden', `${!isActive}`);
      if (isActive) {
        const { deck } = this;
        if (deck) {
          deck.currentSlide = this;
        }
      }
    } else if (attribute === 'full-view') {
      this.setFragmentVisibility(value !== null);
    }
  }

  connectedCallback() {
    this.setAttribute('aria-hidden', `${!this.isActive}`);
  }

  get deck() {
    return this.closest('p-deck');
  }

  get isActive() {
    return this.getAttribute('active') !== null;
  }
  set isActive(isActive) {
    if (!!isActive) {
      this.setAttribute('active', '');
    } else {
      this.removeAttribute('active');
    }
  }

  get isFullView() {
    return this.getAttribute('full-view') !== null;
  }
  set isFullView(isFullView) {
    if (!!isFullView) {
      this.setAttribute('full-view', '');
    } else {
      this.removeAttribute('full-view');
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

  get notes() {
    return this.querySelectorAll('p-notes');
  }

  next() {
    const hiddenFragment = this.nextHiddenFragment;
    if (hiddenFragment) {
      hiddenFragment.setAttribute('aria-hidden', 'false');
      fireEvent(this, 'p-slides.fragmenttoggle', { fragment: hiddenFragment, isVisible: false });
      return false;
    }
    this.isPrevious = true;
    this.isActive = false;
    return true;
  }
  previous() {
    if (!this.isFullView) {
      const visibleFragment = this.lastVisibleFragment;
      if (visibleFragment) {
        visibleFragment.setAttribute('aria-hidden', 'true');
        fireEvent(this, 'p-slides.fragmenttoggle', { fragment: visibleFragment, isVisible: true });
        return false;
      }
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
