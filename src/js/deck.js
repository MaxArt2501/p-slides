import { attachStyle } from './utils.js';

customElements.define('p-deck', class extends HTMLElement {
  connectedCallback() {
    if (!this.root) {
      this.root = this.attachShadow({ mode: 'open' });
      this.root.innerHTML = '<slot></slot>';
      attachStyle('css/deck.css', this.root);
    }

    this.keyHandler = this.keyHandler.bind(this);
    this.computeFontSize = this.computeFontSize.bind(this);

    this.ownerDocument.addEventListener('keydown', this.keyHandler);
    this.ownerDocument.defaultView.requestIdleCallback(() => {
      this.querySelectorAll('p-slide').forEach((slide, index) => slide.active = index === 0);
      this.computeFontSize();
    });
    this.ownerDocument.defaultView.addEventListener('resize', this.computeFontSize, { passive: true });
  }

  disconnectedCallback() {
    this.ownerDocument.removeEventListener('keydown', this.keyHandler);
    this.ownerDocument.defaultView.removeEventListener('resize', this.keyHandler);
  }

  computeFontSize() {
    const { width } = this.slideSizes;
    this.style.fontSize = `${width / 20}px`;
  }

  get slideSizes() {
    const { width, height } = this.getBoundingClientRect();
    const deckRatio = width / height;
    const aspectRatio = +this.ownerDocument.defaultView.getComputedStyle(this).getPropertyValue('--slide-aspect-ratio') || 1.5;
    if (deckRatio > aspectRatio) {
      return { width: height * aspectRatio, height };
    }
    return { width, height: width / aspectRatio };
  }

  get currentSlide() {
    return this.querySelector('p-slide[aria-hidden="false"]');
  }
  get currentIndex() {
    return [ ...this.slides ].findIndex(slide => slide.active);
  }
  set currentIndex(index) {
    const numIndex = +index;
    if (isNaN(index) || numIndex < 0) {
      return;
    }
    const slides = [ ...this.slides ];
    if (numIndex >= slides.length) {
      return;
    }

    for (const slide of slides.slice(0, numIndex)) {
      slide.isPrevious = true;
      slide.active = false;
      slide.setFragmentVisibility(true);
    }
    for (const slide of slides.slice(numIndex)) {
      slide.isPrevious = false;
      slide.active = false;
      slide.setFragmentVisibility(false);
    }
    slides[numIndex].active = true;
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
