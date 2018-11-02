const deck = document.querySelector('p-deck');

function handleHash() {
  const hash = location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const [ slideRef ] = [ ...params.keys() ];

  const slide = getSlide(slideRef);
  const current = document.querySelector('p-slide[active]');

  const mode = params.get('mode');
  if (mode) {
    deck.setAttribute('mode', mode);
  } else {
    deck.removeAttribute('mode');
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

const progressBar = document.querySelector('[role="progressbar"]');
const navButtons = [ ...document.querySelectorAll('nav button') ].reduce((map, button) => {
  map[button.className] = button;
  return map;
}, {});
function toggleNavButtons() {
  navButtons.previous.disabled = deck.atStart;
  navButtons.next.disabled = deck.atEnd;
}

function changeHash(slide) {
  const slideRef = slide.id || deck.currentIndex;
  const { mode } = deck;
  location.href = '#' + slideRef + (mode === 'presentation' ? '' : `&mode=${mode}`);
}
deck.addEventListener('p-slides.slidechange', ({ detail: { slide } }) => {
  changeHash(slide);

  const progress = +(deck.currentIndex * 100 / (deck.slides.length - 1)).toFixed(2);
  progressBar.setAttribute('aria-valuenow', progress);
  progressBar.style.setProperty('--progress', progress + '%');

  toggleNavButtons();
  requestAnimationFrame(() => {
    deck.style.setProperty('--current-slide-bg', getComputedStyle(slide).backgroundColor);
  });
});
deck.addEventListener('p-slides.fragmenttoggle', toggleNavButtons);
navButtons.previous.addEventListener('click', () => deck.previous());
navButtons.next.addEventListener('click', () => deck.next());

const fullscreenButton = document.querySelector('.fullscreen');
fullscreenButton.addEventListener('click', () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.body.requestFullscreen();
  }
});

function toggleDeckMode() {
  const { mode } = deck;
  deck.mode = mode === deck.PRESENTATION_MODE ? deck.SPEAKER_MODE : deck.PRESENTATION_MODE;
  changeHash(deck.currentSlide);
}
const toggleModeButton = document.querySelector('.toggle-mode');
toggleModeButton.addEventListener('click', toggleDeckMode);
document.addEventListener('keydown', keyEvent => {
  if (keyEvent.key.toLowerCase() === 'm' && keyEvent.altKey) {
    toggleDeckMode();
  }
});

