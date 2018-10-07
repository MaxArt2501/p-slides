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
  set currentSlide(nextSlide) {
    if (!(nextSlide instanceof HTMLElement) || nextSlide.nodeName !== 'P-SLIDE') {
      throw Error('Current slide can only be a <p-slide> element');
    }
    if (!this.contains(nextSlide)) {
      throw Error('Deck does not contain given slide');
    }

    const { slides } = this;
    for (const slide of slides) {
      slide.active = slide === nextSlide;
      const positionComparison = nextSlide.compareDocumentPosition(slide);
      const isPrevious = positionComparison & this.DOCUMENT_POSITION_PRECEDING;
      slide.isPrevious = isPrevious;
      slide.setFragmentVisibility(isPrevious);
    }
  }

  get currentIndex() {
    return [ ...this.slides ].findIndex(slide => slide.active);
  }
  set currentIndex(index) {
    const { slides } = this;
    if (slides.lenght === 0 && +index === 0) {
      return;
    }
    const slide = slides[index];
    if (!slide) {
      throw Error(`Slide index out of range (must be 0-${slides.length - 1}, ${index} given)`);
    }
    this.currentSlide = slide;
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
