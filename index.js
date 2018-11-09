import { PresentationDeckElement } from './components/deck.js';
import { PresentationSlideElement } from './components/slide.js';
import { PresentationFragmentElement } from './components/fragment.js';
import { PresentationNotesElement } from './components/notes.js';

export {
  PresentationDeckElement,
  PresentationSlideElement,
  PresentationFragmentElement,
  PresentationNotesElement
};

const prefix = 'p';
export function registerElements() {
  customElements.define(`${prefix}-deck`, PresentationDeckElement);
  customElements.define(`${prefix}-slide`, PresentationSlideElement);
  customElements.define(`${prefix}-fragment`, PresentationFragmentElement);
  customElements.define(`${prefix}-notes`, PresentationNotesElement);
}
