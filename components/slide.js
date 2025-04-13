import { fireEvent, getFragmentIndex, setShadowDOM, whenAllDefined } from '../utils.js';

let allDefined = false;
whenAllDefined().then(() => (allDefined = true));

export class PresentationSlideElement extends HTMLElement {
	constructor() {
		super();
		setShadowDOM.bind(this)`<slot></slot>`;
	}

	static get observedAttributes() {
		return ['aria-current'];
	}

	#setCurrentFragment() {
		this.fragments.forEach((fragment, index, fragments) => {
			fragment.isCurrent = fragment.ariaHidden === 'false' && (!fragments[index + 1] || fragments[index + 1].ariaHidden === 'true');
		});
	}

	attributeChangedCallback(attribute, _, value) {
		if (attribute === 'aria-current') {
			const isActive = value === 'page';
			this.ariaHidden = `${!isActive}`;
			if (isActive) {
				this.#setCurrentFragment();
				if (this.deck) this.deck.currentSlide = this;
			}
		}
	}

	connectedCallback() {
		this.ariaHidden = `${!this.isActive}`;
		this.querySelectorAll('[p-fragment]').forEach(fragment => {
			fragment.ariaHidden ??= 'true';
		});
	}

	get deck() {
		return allDefined ? this.closest('p-deck') : null;
	}

	get isActive() {
		return this.ariaCurrent === 'page';
	}
	set isActive(isActive) {
		this.ariaCurrent = isActive ? 'page' : 'false';
	}

	get isPrevious() {
		return this.hasAttribute('previous');
	}
	set isPrevious(isPrevious) {
		this.toggleAttribute('previous', isPrevious);
	}

	get fragments() {
		const fragments = this.querySelectorAll('p-fragment, [p-fragment]');
		const indexes = new Map(Array.from(fragments, fragment => [fragment, getFragmentIndex(fragment)]));
		return [...fragments].sort((f1, f2) => indexes.get(f1) - indexes.get(f2));
	}

	get nextHiddenFragment() {
		return this.fragments.find(fragment => fragment.ariaHidden === 'true');
	}

	get lastVisibleFragment() {
		return this.fragments.findLast(fragment => fragment.ariaHidden === 'false');
	}

	get notes() {
		return this.querySelectorAll('p-notes, [p-notes]');
	}

	next() {
		const hiddenFragment = this.nextHiddenFragment;
		if (hiddenFragment) {
			hiddenFragment.ariaHidden = 'false';
			this.#setCurrentFragment();
			fireEvent(this, 'fragmenttoggle', {
				fragment: hiddenFragment,
				isVisible: false
			});
			this.deck?.broadcastState();
			return false;
		}
		this.isPrevious = true;
		this.isActive = false;
		return true;
	}
	previous() {
		const visibleFragment = this.lastVisibleFragment;
		if (visibleFragment) {
			visibleFragment.ariaHidden = 'true';
			this.#setCurrentFragment();
			fireEvent(this, 'fragmenttoggle', {
				fragment: visibleFragment,
				isVisible: true
			});
			this.deck?.broadcastState();
			return false;
		}
		this.isPrevious = false;
		this.isActive = false;
		return true;
	}

	setFragmentVisibility(visible) {
		for (const fragment of this.fragments) {
			fragment.ariaHidden = `${!visible}`;
		}
	}
}
