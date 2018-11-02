const deck = document.querySelector('p-deck');

function handleHash() {
  const hash = location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const [ slideRef, ...keys ] = [ ...params.keys() ];

  const slide = getSlide(slideRef);

  const mode = params.get('mode');
  if (mode) {
    deck.setAttribute('mode', mode);
  }
  if (slide && deck.currentSlide !== slide) {
    deck.currentSlide = slide;
  }
}
addEventListener('hashchange', handleHash);
handleHash();

function getSlide(slideRef) {
  if (/^\d+$/.test(`${slideRef}`.trim())) {
    return deck.slides[+slideRef] || null;
  }
  return document.querySelector(`#${slideRef}`);
}

document.addEventListener('p-slides.slidechange', ({ detail: { slide } }) => {
  const slideRef = slide.id || deck.currentIndex;
  const { mode } = deck;
  location.href = '#' + slideRef + (mode === 'presentation' ? '' : `&mode=${mode}`);
});
