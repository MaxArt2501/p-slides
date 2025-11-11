/// <reference lib="es2023.array" />
import {
	collectNotes,
	fireEvent,
	FRAGMENTS,
	getSequencedFragments,
	INITIALLY_VISIBLE,
	isFragmentActivated,
	setCurrentFragments,
	setFragmentActivation,
	whenAllDefined
} from '../utils.js';

let allDefined = false;
whenAllDefined().then(() => (allDefined = true));

/** @typedef {import('../declarations.js').PresentationFragmentToggleEvent} PresentationFragmentToggleEvent */

/** @type {MutationObserverInit} */
const mutationOptions = {
	subtree: true,
	childList: true,
	attributes: true,
	attributeFilter: ['p-fragment', 'index', 'p-group']
};

/**
 * The class corresponding to the `<p-slide>` element.
 * @tag p-slide
 * @attribute {string} aria-current - When set to `'page'`, the slide is the current one in the presentation. It's discouraged to set it manually
 * @attribute {string} effect - Effect name for entering the slide from, or exiting to, the previous slide
 * @fires {PresentationFragmentToggleEvent} p-slides.fragmenttoggle - When a fragment has been shown or hidden
 */
export class PresentationSlideElement extends HTMLElement {
	/** @internal */
	static get observedAttributes() {
		return ['aria-current'];
	}

	#mutations = new MutationObserver(() => {
		this.#fragmentSequence = null;
		this.#notes = null;
	});

	/** @internal */
	attributeChangedCallback(attribute, _, value) {
		if (attribute === 'aria-current') {
			const isActive = value === 'page';
			this.ariaHidden = `${!isActive}`;
			if (isActive) {
				setCurrentFragments(this);
				if (this.deck) this.deck.currentSlide = this;
			}
		}
	}

	/** @internal */
	connectedCallback() {
		this.ariaHidden = `${!this.isActive}`;
		this.querySelectorAll(FRAGMENTS).forEach(fragment => {
			if (fragment.ariaHidden === null) {
				fragment.ariaHidden = String(!fragment.hasAttribute(INITIALLY_VISIBLE));
			} else {
				fragment.toggleAttribute(INITIALLY_VISIBLE, fragment.ariaHidden === 'false');
			}
			fragment.ariaCurrent ??= 'false';
		});
		this.#mutations.observe(this, mutationOptions);
	}

	/** @internal */
	disconnectedCallback() {
		this.#mutations.disconnect();
	}

	/**
	 * The parent presentation deck.
	 */
	get deck() {
		return allDefined ? this.closest('p-deck') : null;
	}

	/**
	 * Whether the slide is the current one in the presentation. This will set the `aria-current` attribute to either
	 * `'page'` or `'false'`.
	 *
	 * It's discouraged to set it manually.
	 */
	get isActive() {
		return this.ariaCurrent === 'page';
	}
	set isActive(isActive) {
		this.ariaCurrent = isActive ? 'page' : 'false';
		if (isActive) setCurrentFragments(this);
	}

	/**
	 * Whether the slide is past the current one in the presentation. This will set a `previous` attribute on the
	 * `<p-slide>` element, that can be used for styling purposes. A slide can be the current one _and_ marked as
	 * "previous" when going backward in the presentation.
	 *
	 * It's discouraged to set it manually.
	 */
	get isPrevious() {
		return this.hasAttribute('previous');
	}
	set isPrevious(isPrevious) {
		this.toggleAttribute('previous', isPrevious);
	}

	/**
	 * The list of the fragment elements as they appear in the slide's markup.
	 * @type {Element[]}
	 */
	get fragments() {
		return this.querySelectorAll(FRAGMENTS);
	}

	#fragmentSequence;

	/**
	 * The fragments grouped using their indexes.
	 * @type {Element[][]}
	 */
	get fragmentSequence() {
		if (!this.#fragmentSequence) {
			this.#fragmentSequence = getSequencedFragments(this.fragments);
		}
		return this.#fragmentSequence;
	}

	/**
	 * The next group of fragments that will be activated when advancing the presentation, if any.
	 */
	get nextInactiveFragments() {
		return this.fragmentSequence.find(fragments => !fragments.every(isFragmentActivated));
	}

	/**
	 * The last group of fragments that has been activated when advancing the presentation, if any.
	 */
	get lastActivatedFragments() {
		return this.fragmentSequence.findLast(fragments => fragments.every(isFragmentActivated));
	}

	#notes;

	/**
	 * The list of the speaker notes as they appear in the slide's fragment sequence.
	 * @type {Array<Element | Comment>}
	 */
	get notes() {
		return this.#notes ?? (this.#notes = collectNotes(this));
	}

	/**
	 * Attempts to advance the presentation by showing a new block of fragments on the current slide. It returns `true` if
	 * no fragments are left to show in the current slide (the deck will advance to the next slide).
	 * @fires {PresentationFragmentToggleEvent} p-slides.fragmenttoggle - If a set of fragments has been toggled
	 */
	next() {
		const inactiveFragments = this.nextInactiveFragments;
		if (inactiveFragments) {
			setFragmentActivation(true)(...inactiveFragments);
			setCurrentFragments(this);
			fireEvent(this, 'fragmenttoggle', {
				fragments: inactiveFragments,
				areActivated: true
			});
			this.deck?.broadcastState();
			return false;
		}
		this.isPrevious = true;
		this.isActive = false;
		return true;
	}

	/**
	 * Attempts to bring the presentation back by hiding the last shown block of fragments on the current slide. It
	 * returns `true` if no fragments are left to hide in the current slide (the deck will go back to the previous slide).
	 * @fires {PresentationFragmentToggleEvent} p-slides.fragmenttoggle - If a set of fragments has been toggled
	 */
	previous() {
		const activatedFragments = this.lastActivatedFragments;
		if (activatedFragments) {
			setFragmentActivation(false)(...activatedFragments);
			setCurrentFragments(this);
			fireEvent(this, 'fragmenttoggle', {
				fragments: activatedFragments,
				areActivated: false
			});
			this.deck?.broadcastState();
			return false;
		}
		this.isPrevious = false;
		this.isActive = false;
		return true;
	}
}
