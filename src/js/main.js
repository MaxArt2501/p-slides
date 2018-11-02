const deck = document.querySelector('p-deck');

function handleHash() {
  const hash = location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const [ slideRef, ...keys ] = [ ...params.keys() ];

  const slide = getSlide(slideRef);
  const current = document.querySelector('p-slide[active]');

  const mode = params.get('mode');
  if (mode) {
    deck.setAttribute('mode', mode);
  }
  if (slide && slide !== current) {
    if (current) {
      current.removeAttribute('active');
    }
    slide.setAttribute('active', '');
  }
}
addEventListener('hashchange', handleHash);
handleHash();

function getSlide(slideRef) {
  if (/^\d+$/.test(`${slideRef}`.trim())) {
    return deck.querySelectorAll('p-slide')[+slideRef] || null;
  }
  return document.querySelector(`#${slideRef}`);
}

document.addEventListener('p-slides.slidechange', ({ detail: { slide } }) => {
  const slideRef = slide.id || deck.currentIndex;
  const { mode } = deck;
  location.href = '#' + slideRef + (mode === 'presentation' ? '' : `&mode=${mode}`);
});
