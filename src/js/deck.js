import { attachStyle, defineConstants, matchKey, createRoot, fireEvent } from './utils.js';

export class PresentationDeckElement extends HTMLElement {
  constructor() {
    super();
    createRoot(this, '<slot></slot><aside><header><span></span><span></span> <time></time> <button type="button"></button> <button type="button"></button></header><ul></ul></aside>');
    attachStyle('css/deck.css', this.root);

    this._clockRemainder = 0;
    this._clockStart = null;
    this._keyHandler = this._keyHandler.bind(this);
    this._computeFontSize = this._computeFontSize.bind(this);
    this._updateClock = this._updateClock.bind(this);

    this.root.querySelector('button').addEventListener('click', () => {
      if (this.isClockRunning) {
        this.stopClock();
      } else {
        this.startClock();
      }
    });
    this.root.querySelector('button:last-of-type').addEventListener('click', () => this.clock = 0);
  }

  connectedCallback() {
    this.ownerDocument.addEventListener('keydown', this._keyHandler);
    const window = this.ownerDocument.defaultView;
    window.requestIdleCallback(() => {
      this._computeFontSize();
      this._resetCurrentSlide();
    });
    window.addEventListener('resize', this._computeFontSize, { passive: true });
    this._clockInterval = window.setInterval(this._updateClock, 1000);
    this.root.querySelector('span:nth-child(2)').textContent = this.slides.length;
    this._updateClock();
  }

  disconnectedCallback() {
    this.ownerDocument.removeEventListener('keydown', this._keyHandler);
    this.ownerDocument.defaultView.removeEventListener('resize', this._computeFontSize);
    this.ownerDocument.defaultView.clearInterval(this._clockInterval);
    this._clockInterval = null;
  }

  get mode() {
    const attrValue = this.getAttribute('mode');
    return [ this.PRESENTATION_MODE, this.SPEAKER_MODE ].includes(attrValue) ? attrValue : this.PRESENTATION_MODE;
  }
  set mode(mode) {
    if ([ this.PRESENTATION_MODE, this.SPEAKER_MODE ].includes(mode)) {
      this.setAttribute('mode', mode);
    }
  }

  _resetCurrentSlide(nextSlide = this.querySelector('p-slide')) {
    let { currentSlide } = this;
    if (!currentSlide && nextSlide) {
      currentSlide = nextSlide;
    }
    if (currentSlide) {
      this.currentSlide = currentSlide;
    }
  }

  _computeFontSize() {
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
    const { _currentSlide } = this;
    if (_currentSlide === nextSlide) {
      return;
    }
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
    let isNext = false;
    for (const slide of slides) {
      if (isNext) {
        slide.setAttribute('next', '');
        isNext = false;
      } else {
        slide.removeAttribute('next');
      }
      if (slide === nextSlide) {
        isPrevious = false;
        isNext = true;
      } else {
        slide.isActive = false;
        slide.isPrevious = isPrevious;
        slide.setFragmentVisibility(isPrevious);
      }
    }
    this.root.querySelector('span').textContent = this.currentIndex + 1;
    const noteContainer = this.root.querySelector('ul');
    while (noteContainer.lastChild) {
      noteContainer.removeChild(noteContainer.lastChild);
    }
    nextSlide.notes.forEach(note => {
      const li = this.ownerDocument.createElement('li');
      for (const child of note.childNodes) {
        li.appendChild(child.cloneNode(true));
      }
      noteContainer.appendChild(li);
    });
    this._currentSlide = nextSlide;
    fireEvent(this, 'p-slides.slidechange', { slide: nextSlide, previous: _currentSlide });
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

  _keyHandler(keyEvent) {
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
      if (this.atEnd) {
        fireEvent(this, 'p-slides.finish');
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

  startClock() {
    this._clockStart = Date.now();
    this.root.querySelector('time').setAttribute('running', '');
  }
  stopClock() {
    if (this.isClockRunning) {
      this._clockRemainder += Date.now() - this._clockStart;
    }
    this._clockStart = null;
    this.root.querySelector('time').removeAttribute('running');
  }
  _updateClock() {
    const secs = Math.floor(this.clock / 1000);
    this.root.querySelector('time').textContent
      = (secs < 0 ? '-' : '')
      + Math.floor(secs / 3600).toString().padStart(2, '0')
      + ':' + Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
      + ':' + Math.floor(secs % 60).toString().padStart(2, '0');
  }
  get clock() {
    return this._clockRemainder + (this.isClockRunning ? Date.now() - this._clockStart : 0);
  }
  set clock(value) {
    if (!isNaN(value)) {
      this._clockRemainder = +value;
      if (this.isClockRunning) {
        this._clockStart = Date.now();
      }
    }
    if (this._clockInterval) {
      this._updateClock();
    }
  }
  get isClockRunning() {
    return this._clockStart !== null;
  }

  get state() {
    const state = {
      currentIndex: this.currentIndex,
      currentSlideFragmentVisibility: this.currentSlide.fragments.map(f => f.isVisible),
      clockRemainder: this._clockRemainder,
      clockStart: this._clockStart
    };
    return state;
  }
  set state(state) {
    this.currentIndex = state.currentIndex;
    this._clockRemainder = state.clockRemainder;
    this._clockStart = state.clockStart;
    this.currentSlide.fragments.forEach((fragment, index) => {
      fragment.isVisible = state.currentSlideFragmentVisibility[index];
    });
  }
}

const _proto = PresentationDeckElement.prototype;
defineConstants(_proto, {
  NEXT_COMMAND: 'next',
  PREVIOUS_COMMAND: 'previous',
  PRESENTATION_MODE: 'presentation',
  SPEAKER_MODE: 'speaker'
});
_proto.keyCommands = {
  [_proto.NEXT_COMMAND]: [{ key: 'ArrowRight' }, { key: 'ArrowDown' }],
  [_proto.PREVIOUS_COMMAND]: [{ key: 'ArrowLeft' }, { key: 'ArrowUp' }]
};

customElements.define('p-deck', PresentationDeckElement);
