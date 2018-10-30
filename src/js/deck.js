import { attachStyle, defineConstants, matchKey, createRoot } from './utils.js';

export class PresentationDeckElement extends HTMLElement {
  constructor() {
    super();
    createRoot(this, '<slot></slot>');
    attachStyle('css/deck.css', this.root);
  }

  connectedCallback() {
    this.keyHandler = this.keyHandler.bind(this);
    this.computeFontSize = this.computeFontSize.bind(this);

    this.ownerDocument.addEventListener('keydown', this.keyHandler);
    this.ownerDocument.defaultView.requestIdleCallback(() => {
      this.computeFontSize();
      this.resetCurrentSlide();
    });
    this.ownerDocument.defaultView.addEventListener('resize', this.computeFontSize, { passive: true });
  }

  disconnectedCallback() {
    this.ownerDocument.removeEventListener('keydown', this.keyHandler);
    this.ownerDocument.defaultView.removeEventListener('resize', this.keyHandler);
  }

  resetCurrentSlide(nextSlide = this.querySelector('p-slide')) {
    let { currentSlide } = this;
    if (!currentSlide) {
      currentSlide = nextSlide;
    }
    if (currentSlide) {
      this.currentSlide = currentSlide;
    }
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
    return this.querySelector('p-slide[active]');
  }
  set currentSlide(nextSlide) {
    if (!(nextSlide instanceof HTMLElement) || nextSlide.nodeName !== 'P-SLIDE') {
      throw Error('Current slide can only be a <p-slide> element');
    }
    if (!this.contains(nextSlide)) {
      throw Error('Deck does not contain given slide');
    }
    if (!nextSlide.isActive) {
      nextSlide.isActive = true;
      return;
    }

    const { slides } = this;
    let isPrevious = true;
    for (const slide of slides) {
      if (slide === nextSlide) {
        isPrevious = false;
      } else {
        slide.isActive = false;
        slide.isPrevious = isPrevious;
        slide.setFragmentVisibility(isPrevious);
      }
    }
  }

  get currentIndex() {
    return [ ...this.slides ].findIndex(slide => slide.isActive);
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

  keyHandler(keyEvent) {
    const command = matchKey(keyEvent, this.keyCommands);
    switch (command) {
      case this.PREVIOUS_COMMAND:
        this.previous();
        break;
      case this.NEXT_COMMAND:
        this.next();
        break;
    }
  }

  next() {
    if (!this.atEnd) {
      const { currentIndex } = this;
      const goToNext = this.currentSlide.next();
      if (goToNext) {
        this.slides[currentIndex + 1].isActive = true;
      }
    }
  }

  previous() {
    if (!this.atStart) {
      const { currentIndex } = this;
      const goToPrevious = this.currentSlide.previous();
      if (goToPrevious) {
        this.slides[currentIndex - 1].isActive = true;
      }
    }
  }
}

const _proto = PresentationDeckElement.prototype;
defineConstants(_proto, {
  NEXT_COMMAND: 'next',
  PREVIOUS_COMMAND: 'previous'
});
_proto.keyCommands = {
  [_proto.NEXT_COMMAND]: [{ key: 'ArrowRight' }, { key: 'ArrowDown' }],
  [_proto.PREVIOUS_COMMAND]: [{ key: 'ArrowLeft' }, { key: 'ArrowUp' }]
};

customElements.define('p-deck', PresentationDeckElement);
