import {
	checkNoteActivations,
	copyNotes,
	fireEvent,
	formatClock,
	isFragmentVisible,
	matchKey,
	selectSlide,
	setFragmentVisibility,
	setShadowDOM,
	styleRoot,
	whenAllDefined
} from '../utils.js';

/** @type {Promise<CSSStyleSheet>>} */
let stylesheet;

/**
 * @param {HTMLElement} element
 * @returns {Promise<CSSStyleSheet>}
 */
export const getStylesheet = () => {
	if (!stylesheet) {
		stylesheet = fetch(`${styleRoot}deck.css`)
			.then(res => res.text())
			.then(text => {
				const styleSheet = new CSSStyleSheet();
				styleSheet.replaceSync(text);
				return styleSheet;
			});
	}
	return stylesheet;
};

export class PresentationDeckElement extends HTMLElement {
	#clockElapsed = 0;
	#clockStart = null;
	#clockInterval = null;

	#channel = new BroadcastChannel('p-slides');

	keyCommands = {
		next: [{ key: 'ArrowRight' }, { key: 'ArrowDown' }],
		previous: [{ key: 'ArrowLeft' }, { key: 'ArrowUp' }],
		toggleclock: [{ key: 'P' }, { key: 'p' }],
		resetclock: [{ key: '0', altKey: true }],
		toggleMode: [
			{ key: 'M', altKey: true },
			{ key: 'm', altKey: true }
		]
	};

	constructor() {
		super();

		const html = setShadowDOM.bind(this);
		html`<slot></slot>
			<aside>
				<header><span></span><span></span> <time></time> <button type="button"></button> <button type="button"></button></header>
				<ul></ul>
			</aside>`;
		getStylesheet().then(style => {
			this.shadowRoot.adoptedStyleSheets.push(style);
			this.#computeFontSize();
		});

		this.shadowRoot.querySelector('button').addEventListener('click', this.toggleClock);
		this.shadowRoot.querySelector('button:last-of-type').addEventListener('click', () => (this.clock = 0));

		// Channel for state sync
		this.#channel.addEventListener('message', ({ data }) => {
			// Sending a null state => requesting the state
			if (data === null) {
				this.broadcastState();
			} else
				this.#muteAction(() => {
					this.state = data;
				});
		});
	}

	#muteAction(fn) {
		this.#preventBroadcast = true;
		fn();
		this.#preventBroadcast = false;
	}

	connectedCallback() {
		this.ownerDocument.addEventListener('keydown', this.#keyHandler);
		this.ownerDocument.defaultView.addEventListener('resize', this.#computeFontSize, { passive: true });
		this.#clockInterval = this.ownerDocument.defaultView.setInterval(() => this.#updateClock(), 1000);
		this.shadowRoot.querySelector('span:nth-child(2)').textContent = this.slides.length;
		this.#updateClock();

		whenAllDefined().then(() => {
			this.#muteAction(() => this.#resetCurrentSlide());
			this.requestState();
		});
	}

	disconnectedCallback() {
		this.ownerDocument.removeEventListener('keydown', this.#keyHandler);
		this.ownerDocument.defaultView.removeEventListener('resize', this.#computeFontSize);
		this.ownerDocument.defaultView.clearInterval(this.#clockInterval);
		this.#clockInterval = null;
		this.stopClock();
	}

	get mode() {
		const attrValue = this.getAttribute('mode');
		return ['presentation', 'speaker'].includes(attrValue) ? attrValue : 'presentation';
	}
	set mode(mode) {
		if (['presentation', 'speaker'].includes(mode)) {
			this.setAttribute('mode', mode);
		}
	}

	#resetCurrentSlide(nextSlide = this.querySelector('p-slide')) {
		let { currentSlide } = this;
		if (!currentSlide && nextSlide) {
			currentSlide = nextSlide;
		}
		if (currentSlide) {
			this.currentSlide = currentSlide;
		}
	}

	#computeFontSize = function () {
		const { width } = this.slideSizes;
		const fontSize = +this.ownerDocument.defaultView.getComputedStyle(this).getPropertyValue('--slide-font-size') || 5;
		this.style.fontSize = `${(width * fontSize) / 100}px`;
	}.bind(this);

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
		return this.querySelector('p-slide[aria-current="page"]');
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

		selectSlide(this.slides, nextSlide);
		this.shadowRoot.querySelector('span').textContent = this.currentIndex + 1;
		copyNotes(this.shadowRoot.querySelector('ul'), nextSlide.notes);

		this._currentSlide = nextSlide;
		fireEvent(this, 'slidechange', { slide: nextSlide, previous: _currentSlide });
		if (this.atEnd) {
			fireEvent(this, 'finish');
		}
		this.broadcastState();
	}

	get currentIndex() {
		return [...this.slides].findIndex(slide => slide.isActive);
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
		const { slides } = this;
		if (this.currentIndex < slides.length - 1) return false;
		const lastSlide = slides[slides.length - 1];
		return !lastSlide || !lastSlide.nextHiddenFragment;
	}

	#keyHandler = function (keyEvent) {
		const command = matchKey(keyEvent, this.keyCommands);
		switch (command) {
			case 'previous':
				this.previous();
				break;
			case 'next':
				this.next();
				break;
			case 'toggleclock':
				this.toggleClock();
				break;
			case 'resetclock':
				this.clock = 0;
				break;
			case 'toggleMode':
				this.mode = this.mode === 'speaker' ? 'presentation' : 'speaker';
				break;
		}
	}.bind(this);

	next() {
		if (!this.atEnd) {
			const { currentIndex, currentSlide } = this;
			const goToNext = currentSlide.next();
			if (goToNext) {
				this.slides[currentIndex + 1].isActive = true;
			} else {
				checkNoteActivations(this.shadowRoot.querySelector('ul'), currentSlide.notes);
				if (this.atEnd) {
					fireEvent(this, 'finish');
				}
			}
		}
	}

	previous() {
		if (!this.atStart) {
			const { currentIndex, currentSlide } = this;
			const goToPrevious = currentSlide.previous();
			if (goToPrevious) {
				this.slides[currentIndex - 1].isActive = true;
			} else {
				checkNoteActivations(this.shadowRoot.querySelector('ul'), currentSlide.notes);
			}
		}
	}

	startClock() {
		this.#clockStart = Date.now();
		this.shadowRoot.querySelector('time').setAttribute('running', '');
		fireEvent(this, 'clockstart', { timestamp: this.#clockStart, elapsed: this.#clockElapsed });
		this.broadcastState();
	}

	stopClock() {
		if (this.isClockRunning) {
			this.#clockElapsed += Date.now() - this.#clockStart;
		}
		this.#clockStart = null;
		this.shadowRoot.querySelector('time').removeAttribute('running');
		fireEvent(this, 'clockstop', { elapsed: this.#clockElapsed });
		this.broadcastState();
	}

	toggleClock = function () {
		if (this.isClockRunning) {
			this.stopClock();
		} else {
			this.startClock();
		}
	}.bind(this);

	#updateClock() {
		this.shadowRoot.querySelector('time').textContent = formatClock(this.clock);
	}

	get clock() {
		return this.#clockElapsed + (this.isClockRunning ? Date.now() - this.#clockStart : 0);
	}
	set clock(value) {
		if (!isNaN(value)) {
			this.#clockElapsed = +value;
			if (this.isClockRunning) {
				this.#clockStart = Date.now();
			}
			fireEvent(this, 'clockset', { elapsed: this.#clockElapsed });
			this.broadcastState();
		}
		if (this.#clockInterval) {
			this.#updateClock();
		}
	}

	get isClockRunning() {
		return this.#clockStart !== null;
	}

	get state() {
		const state = {
			currentIndex: this.currentIndex,
			currentSlideFragmentVisibility: this.currentSlide.fragments.map(isFragmentVisible),
			clockElapsed: this.#clockElapsed,
			clockStart: this.#clockStart
		};
		return state;
	}
	set state(state) {
		this.currentIndex = state.currentIndex;
		this.#clockElapsed = state.clockElapsed;
		this.#clockStart = state.clockStart;
		this.currentSlide.fragments.forEach((fragment, index) => {
			setFragmentVisibility(fragment, state.currentSlideFragmentVisibility[index]);
		});
	}

	#preventBroadcast = false;

	broadcastState() {
		if (!this.#preventBroadcast) {
			this.#channel.postMessage(this.state);
		}
	}

	requestState() {
		this.#channel.postMessage(null);
	}
}
