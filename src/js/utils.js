export function attachStyle(url, root) {
  const linkEl = root.ownerDocument.createElement('link');
  linkEl.rel = 'stylesheet';
  linkEl.href = url;
  return new Promise((resolve, reject) => {
    linkEl.addEventListener('load', () => {
      resolve(linkEl.sheet);
    });
    linkEl.addEventListener('error', reject);
    root.appendChild(linkEl);
  });
}

export function defineConstants(target, constantMap) {
  const propDefinitions = Object.entries(constantMap).reduce((map, [ key, value ]) => {
    map[key] = { value, writable: false };
    return map;
  }, {});
  Object.defineProperties(target, propDefinitions);
}

export function matchKey(keyEvent, keyMap) {
  for (const [ command, keys ] of Object.entries(keyMap)) {
    for (const keyDef of keys) {
      const { key, altKey = false, ctrlKey = false, metaKey = false, shiftKey = false } = keyDef;
      const normalizedKeyDef = { key, altKey, ctrlKey, metaKey, shiftKey };
      if (Object.entries(normalizedKeyDef).every(([ prop, value ]) => keyEvent[prop] === value)) {
        return command;
      }
    }
  }
  return null;
}

export function createRoot(element, innerHTML) {
  if (element.root) return;

  element.root = element.attachShadow({ mode: 'open' });
  element.root.innerHTML = innerHTML;
}

export function fireEvent(target, eventName, detail = {}) {
  const event = new CustomEvent(eventName, { bubbles: true, detail });
  target.dispatchEvent(event);
}
