import { attachStyle } from './utils.js';

customElements.define('p-deck', class extends HTMLElement {
  connectedCallback() {
    if (!this.root) {
      this.root = this.attachShadow({ mode: 'open' });
      this.root.innerHTML = '<slot></slot>';
      attachStyle('css/deck.css', this.root);
    }

    requestIdleCallback(() => {
      this.querySelectorAll('p-slide').forEach((slide, index) => slide.active = index === 0);
    });

    this.keyHandler = this.keyHandler.bind(this);
    this.ownerDocument.addEventListener('keydown', this.keyHandler);
  }

  disconnectedCallback() {
    this.ownerDocument.removeEventListener('keydown', this.keyHandler);
  }

  get currentSlide() {
    return this.querySelector('p-slide[aria-hidden="false"]');
  }
  get currentIndex() {
    return [ ...this.slides ].findIndex(slide => slide.active);
  }
  get slides() {
    return this.querySelectorAll('p-slide');
  }
  get atStart() {
    if (this.currentIndex > 0) {
      return false;
    }
    const firstSlide = this.slides[0];
    return !firstSlide || !firstSlide.lastVisibleFragment;
  }
  get atEnd() {
    if (this.currentIndex < this.slides.length - 1) {
      return false;
    }
    const { slides } = this;
    const lastSlide = slides[slides.length - 1];
    return !lastSlide || !lastSlide.nextHiddenFragment;
  }

  keyHandler({ code }) {
    const currentIndex = this.currentIndex;
    if (code === 'ArrowLeft' && !this.atStart) {
      const goToPrevious = this.currentSlide.previous();
      if (goToPrevious) {
        this.slides[currentIndex - 1].active = true;
      }
    } else if (code === 'ArrowRight' && !this.atEnd) {
      const goToNext = this.currentSlide.next();
      if (goToNext) {
        this.slides[currentIndex + 1].active = true;
      }
    }
  }
});
