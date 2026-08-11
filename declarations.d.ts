import { PresentationDeckElement } from './components/deck.js';
import { PresentationSlideElement } from './components/slide.js';

export type KeyMatcher = Partial<KeyboardEvent>;
export type KeyCommand =
	| 'next'
	| 'previous'
	| 'nextslide'
	| 'previousslide'
	| 'gotostart'
	| 'gotoend'
	| 'toggleclock'
	| 'resetclock'
	| 'togglemode'
	| 'previousmode';

export interface PresentationState {
	currentIndex: number;
	currentSlideFragmentActivation: boolean[];
	clockElapsed: number;
	clockStart: number | null;
	deckId: string;
}

export type PresentationLabel<Context> = string | ((context: Context) => string);
export type PresentationDeckLabelName = 'ELAPSED_TIME' | 'TIMER_START' | 'TIMER_PAUSE' | 'TIMER_RESET' | 'SLIDE_COUNTER';

type PseudoCustomEvent<T = {}> = CustomEvent<T> & T;

export type PresentationSlideChangeEvent = PseudoCustomEvent<{
	/** The new current slide */
	slide: PresentationSlideElement;
	/** The slide previouly set as current */
	previous: PresentationSlideElement | null;
}>;

export type PresentationFinishEvent = PseudoCustomEvent;

export type PresentationClockStartEvent = PseudoCustomEvent<{
	/** Epoch timestamp when the times has been started */
	timestamp: number;
	/** Milliseconds on the timer */
	elapsed: number;
}>;

export type PresentationClockStopEvent = PseudoCustomEvent<{
	/** Milliseconds on the timer */
	elapsed: number;
}>;

export type PresentationClockSetEvent = PseudoCustomEvent<{
	/** Milliseconds on the timer */
	elapsed: number;
}>;

export type PresentationFragmentToggleEvent = PseudoCustomEvent<{
	/** The fragments that have been toggled */
	fragments: Element[];
	/** The activation state of the toggled fragments */
	areActivated: boolean;
}>;

declare global {
	interface Uint8Array {
		toHex(): string;
	}
	interface HTMLElementTagNameMap {
		'p-deck': PresentationDeckElement;
		'p-slide': PresentationSlideElement;
	}
	interface HTMLElementEventMap {
		'p-slides.slidechange': PresentationSlideChangeEvent;
		'p-slides.finish': PresentationFinishEvent;
		'p-slides.clockstart': PresentationClockStartEvent;
		'p-slides.clockstop': PresentationClockStopEvent;
		'p-slides.clockset': PresentationClockSetEvent;
		'p-slides.fragmenttoggle': PresentationFragmentToggleEvent;
	}
}

export type PresentationKeyHandler = (event: KeyboardEvent, deck: PresentationDeckElement) => boolean;
