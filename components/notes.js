export class PresentationNotesElement extends HTMLElement {
	get isVisible() {
		const fragment = this.closest('p-fragment, [p-fragment]');
		return !fragment || fragment.getAttribute('aria-hidden') === 'false';
	}
}
