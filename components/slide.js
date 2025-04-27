import {
	fireEvent,
	getSequencedFragments,
	isFragmentVisible,
	setCurrentFragments,
	setFragmentVisibility,
	whenAllDefined
} from '../utils.js';

let allDefined = false;
whenAllDefined().then(() => (allDefined = true));

export class PresentationSlideElement extends HTMLElement {
	static get observedAttributes() {
		return ['aria-current'];
	}

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

	connectedCallback() {
		this.ariaHidden = `${!this.isActive}`;
		this.querySelectorAll('p-fragment, [p-fragment]').forEach(fragment => {
			fragment.ariaHidden ??= 'true';
			fragment.ariaCurrent ??= 'false';
		});
	}

	/** @type {import('./deck.js').PresentationDeckElement | null} */
	get deck() {
		return allDefined ? this.closest('p-deck') : null;
	}

	get isActive() {
		return this.ariaCurrent === 'page';
	}
	set isActive(isActive) {
		this.ariaCurrent = isActive ? 'page' : 'false';
		if (isActive) setCurrentFragments(this);
	}

	get isPrevious() {
		return this.hasAttribute('previous');
	}
	set isPrevious(isPrevious) {
		this.toggleAttribute('previous', isPrevious);
	}

	get fragments() {
		return this.querySelectorAll('p-fragment, [p-fragment]');
	}

	get fragmentSequence() {
		return getSequencedFragments(this.fragments);
	}

	get nextHiddenFragments() {
		return this.fragmentSequence.find(fragments => !fragments.every(isFragmentVisible));
	}

	get lastVisibleFragments() {
		return this.fragmentSequence.findLast(fragments => fragments.every(isFragmentVisible));
	}

	get notes() {
		return this.querySelectorAll('p-notes, [p-notes]');
	}

	next() {
		const hiddenFragments = this.nextHiddenFragments;
		if (hiddenFragments) {
			setFragmentVisibility(true)(...hiddenFragments);
			setCurrentFragments(this);
			fireEvent(this, 'fragmenttoggle', {
				fragments: hiddenFragments,
				areVisible: false
			});
			this.deck?.broadcastState();
			return false;
		}
		this.isPrevious = true;
		this.isActive = false;
		return true;
	}

	previous() {
		const visibleFragments = this.lastVisibleFragments;
		if (visibleFragments) {
			setFragmentVisibility(false)(...visibleFragments);
			setCurrentFragments(this);
			fireEvent(this, 'fragmenttoggle', {
				fragments: visibleFragments,
				areVisible: true
			});
			this.deck?.broadcastState();
			return false;
		}
		this.isPrevious = false;
		this.isActive = false;
		return true;
	}
}
