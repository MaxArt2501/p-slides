/// <reference lib="es2023.array" />
import {
	fireEvent,
	getNotes,
	getSequencedFragments,
	isFragmentVisible,
	setCurrentFragments,
	setFragmentVisibility,
	whenAllDefined
} from '../utils.js';

let allDefined = false;
whenAllDefined().then(() => (allDefined = true));

/** @typedef {import('../declarations.js').PresentationFragmentToggleEvent} PresentationFragmentToggleEvent */

/**
 * The class corresponding to the `<p-slide>` element.
 */
export class PresentationSlideElement extends HTMLElement {
	/** @internal */
	static get observedAttributes() {
		return ['aria-current'];
	}

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
		this.querySelectorAll('p-fragment, [p-fragment]').forEach(fragment => {
			fragment.ariaHidden ??= 'true';
			fragment.ariaCurrent ??= 'false';
		});
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
	 */
	get fragments() {
		return this.querySelectorAll('p-fragment, [p-fragment]');
	}

	/**
	 * The fragments grouped using their indexes.
	 */
	get fragmentSequence() {
		return getSequencedFragments(this.fragments);
	}

	/**
	 * The next group of fragments that will be shown when advancing the presentation, if any.
	 */
	get nextHiddenFragments() {
		return this.fragmentSequence.find(fragments => !fragments.every(isFragmentVisible));
	}

	/**
	 * The last group of fragments that has been shown when advancing the presentation, if any.
	 */
	get lastVisibleFragments() {
		return this.fragmentSequence.findLast(fragments => fragments.every(isFragmentVisible));
	}

	/**
	 * The list of the speaker notes as they appear in the slide's markup.
	 */
	get notes() {
		return getNotes(this);
	}

	/**
	 * Attempts to advance the presentation by showing a new block of fragments on the current slide. It returns `true` if
	 * no fragments are left to show in the current slide (the deck will advance to the next slide).
	 * @fires {PresentationFragmentToggleEvent} p-slides.fragmenttoggle - If a set of fragments has been toggled
	 */
	next() {
		const hiddenFragments = this.nextHiddenFragments;
		if (hiddenFragments) {
			setFragmentVisibility(true)(...hiddenFragments);
			setCurrentFragments(this);
			fireEvent(this, 'fragmenttoggle', {
				fragments: hiddenFragments,
				areVisible: true
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
		const visibleFragments = this.lastVisibleFragments;
		if (visibleFragments) {
			setFragmentVisibility(false)(...visibleFragments);
			setCurrentFragments(this);
			fireEvent(this, 'fragmenttoggle', {
				fragments: visibleFragments,
				areVisible: false
			});
			this.deck?.broadcastState();
			return false;
		}
		this.isPrevious = false;
		this.isActive = false;
		return true;
	}
}
