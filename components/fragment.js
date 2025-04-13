import { getFragmentIndex, setShadowDOM } from '../utils.js';

export class PresentationFragmentElement extends HTMLElement {
	constructor() {
		super();
		Promise.resolve().then(() => (this.ariaHidden ??= 'true'));
		setShadowDOM.bind(this)`<slot></slot>`;
	}

	get index() {
		return getFragmentIndex(this);
	}
	set index(index = 0) {
		const attrIndex = +index || 0;
		if (attrIndex) {
			this.setAttribute('index', attrIndex);
		} else {
			this.removeAttribute('index');
		}
	}

	get isVisible() {
		return this.ariaHidden === 'false';
	}
	set isVisible(isVisible) {
		this.ariaHidden = `${!isVisible}`;
	}

	get isCurrent() {
		return this.ariaCurrent === 'step';
	}
	set isCurrent(isCurrent) {
		this.ariaCurrent = isCurrent ? 'step' : 'false';
	}
}
